.PHONY: build
build:
	$(MAKE) clean
	$(MAKE) venv
	$(MAKE) setup-web

setup-web: venv yarn.lock
	yarn run setup

venv: requirements.txt
	python -m venv venv
	venv/bin/pip install --upgrade pip
	venv/bin/pip install --target packages/flare/python/vendor -r requirements.txt
	@find packages/flare/python/vendor -type d -name "*.dist-info" -exec rm -r {} +
	@find packages/flare/python/vendor -type d -name "__pycache__" -exec rm -r {} +
	@rm -rf packages/flare/python/vendor/bin
	@rm -rf packages/flare/python/vendor/packaging
	@rm -rf packages/flare/python/vendor/*-stubs

venv-tools: requirements.tools.txt venv
	rm -rf venv-tools
	python -m venv venv-tools
	venv-tools/bin/pip install --upgrade pip
	venv-tools/bin/pip install -r requirements.tools.txt

.PHONY: clean
clean:
	@echo "Removing venv and venv-tools."
	rm -rf venv
	rm -rf venv-tools
	rm -rf packages/flare/python/vendor
	@unlink "/Applications/Splunk/etc/apps/flare" || true
	@find . -type d -name "node_modules" -exec rm -rf {} +
	rm -rf packages/flare/flare
	@rm -f flare.tar.gz
	@echo "Done."

.PHONY: package
package: packages/flare/python/vendor
	-@rm flare.tar.gz
	@find packages/flare/python -type d -name "__pycache__" -exec rm -r {} +
	COPYFILE_DISABLE=1 tar \
		--exclude='packages/flare/flare/local' \
		--exclude='packages/flare/flare/metadata/local.meta' \
		--format ustar \
		-C packages/flare \
		-cvzf \
		"flare.tar.gz" \
		"flare"

# This will not work until we get an APPID - need to submit in Splunkbase UI first.
.PHONY: publish
publish: packages/flare.tar.gz
	curl -u   --request POST https://splunkbase.splunk.com/api/v1/app/<APPID>/new_release/ -F "files[]=@./packages/flare.tar.gz" -F "filename=packages/flare.tar.gz" -F "cim_versions=4.9,4.7" -F "splunk_versions=9.3" -F "visibility=true"

# A manual review from the Splunk team will be required to know if we need to fix any of these tag warnings.
.PHONY: validate
validate: venv-tools
	@echo "Running Splunk AppInspect..."
	@echo "If you get an error about \"libmagic\", run \"brew install libmagic\""
	@venv-tools/bin/splunk-appinspect inspect --ci "packages/flare/flare" || \
	if test  "$$?" -eq "102" || "$$?" -eq "103" ; then \
		exit 0 ; \
	else \
		exit 1 ; \
	fi

# This is helpful for identifying tags that are emitting warnings
TAGS = advanced_xml alert_actions_conf ast bias cloud csv custom_search_commands custom_search_commands_v2 custom_visualizations custom_workflow_actions deprecated_feature developer_guidance django_bindings future java jquery manual markdown migration_victoria modular_inputs offensive packaging_standards private_app private_classic private_victoria pura python3_version removed_feature restmap_config savedsearches security spec splunk_5_0 splunk_6_0 splunk_6_1 splunk_6_2 splunk_6_3 splunk_6_4 splunk_6_5 splunk_6_6 splunk_7_0 splunk_7_1 splunk_7_2 splunk_7_3 splunk_8_0 splunk_9_0 splunk_appinspect web_conf windows
.PHONY: inspect-tags
inspect-tags:
	@for TAG in $(TAGS); do \
		echo "Tag: $$TAG" ; \
		venv-tools/bin/splunk-appinspect inspect --ci --included-tags $$TAG "packages/flare/flare" ; \
	done

.PHONY: test
test: venv-tools
	@if test -d "./tests" ; \
		then venv-tools/bin/pytest ./**/*.py -vv ; \
	fi

.PHONY: format setup-web
format: venv-tools
	venv-tools/bin/ruff check --fix --unsafe-fixes
	venv-tools/bin/ruff format
	yarn run format

.PHONY: format-check
format-check: venv-tools
	venv-tools/bin/ruff check
	venv-tools/bin/ruff format --check
	yarn run format:verify

.PHONY: lint
lint: setup-web venv-tools mypy format-check
	yarn run lint

.PHONY: mypy
mypy: venv-tools
	venv-tools/bin/mypy packages/flare

.PHONY: splunk-local
splunk-local: venv setup-web
	@echo "Create symlink from app to Splunk Enterprise and start watching files"
	SPLUNK_HOME="/Applications/Splunk" yarn run link
	yarn run start
