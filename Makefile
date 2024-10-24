.PHONY: build
build:
	$(MAKE) clean
	$(MAKE) venv

venv: requirements.txt
	python -m venv venv
	venv/bin/pip install --upgrade pip
	venv/bin/pip install --target flare_splunk_integration/bin/vendor -r requirements.txt
	@find flare_splunk_integration/bin/vendor -type d -name "*.dist-info" -exec rm -r {} +
	@find flare_splunk_integration/bin/vendor -type d -name "__pycache__" -exec rm -r {} +
	@rm -rf flare_splunk_integration/bin/vendor/bin
	@rm -rf flare_splunk_integration/bin/vendor/packaging
	@rm -rf flare_splunk_integration/bin/vendor/*-stubs

venv-tools: requirements.tools.txt venv
	rm -rf venv-tools
	python -m venv venv-tools
	venv-tools/bin/pip install --upgrade pip
	venv-tools/bin/pip install -r requirements.tools.txt

.PHONY: clean
clean:
	@echo "Removing venv and venv-tools."
	@rm -rf venv
	@rm -rf venv-tools
	@rm -rf flare_splunk_integration/bin/vendor
	@unlink "/Applications/Splunk/etc/apps/flare_splunk_integration" || true
	@echo "Done."

.PHONY: package
package:
	-@rm flare_splunk_integration.tar.gz
	@echo "Packaging app..."
	@package
	@echo "Done."

# A manual review from the Splunk team will be required to know if we need to fix any of these tag warnings.
.PHONY: validate
validate: venv-tools
	@echo "Running Splunk AppInspect..."
	@echo "If you get an error about \"libmagic\", run \"brew install libmagic\""
	@venv-tools/bin/splunk-appinspect inspect --ci "flare_splunk_integration" || \
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
		venv-tools/bin/splunk-appinspect inspect --ci --included-tags $$TAG "flare_splunk_integration" ; \
	done

.PHONY: test
test: venv-tools
	@if test -d "./tests" ; \
		then venv-tools/bin/pytest ./**/*.py -vv ; \
	fi

.PHONY: format
format: venv-tools
	venv-tools/bin/ruff check --fix --unsafe-fixes
	venv-tools/bin/ruff format

.PHONY: format-check
format-check: venv-tools
	venv-tools/bin/ruff check
	venv-tools/bin/ruff format --check

.PHONY: lint
lint: mypy format-check

.PHONY: mypy
mypy: venv-tools
	venv-tools/bin/mypy flare_splunk_integration

.PHONY: splunk-local
splunk-local: venv
	@echo "Create symlink from app to Splunk Enterprise"
	@if [ ! -d "/Applications/Splunk/etc/apps" ]; then \
		echo "Splunk Enterprise isn't installed"; \
		exit 1; \
	fi

	@unlink "/Applications/Splunk/etc/apps/flare_splunk_integration" || true
	@ln -s "$(CURDIR)/flare_splunk_integration" "/Applications/Splunk/etc/apps/flare_splunk_integration"
