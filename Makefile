.PHONY: build
build:
	$(MAKE) clean
	$(MAKE) venv

venv: requirements.txt
	python -m venv venv
	venv/bin/pip install --upgrade pip
	venv/bin/pip install --target flare_splunk_integration/bin/vendor -r requirements.txt
	@find flare_splunk_integration/bin/vendor -type d -name "*.dist-info" -exec rm -r {} +
	@rm -rf flare_splunk_integration/bin/vendor/bin
	@rm -rf flare_splunk_integration/bin/vendor/packaging
	@rm -rf flare_splunk_integration/bin/vendor/*-stubs
	@rm -rf flare_splunk_integration/bin/vendor/__pycache__

venv-tools: requirements.tools.txt venv
	rm -rf venv-tools
	python -m venv venv-tools
	venv-tools/bin/pip install --upgrade pip
	venv-tools/bin/pip install -r requirements.tools.txt

.PHONY: clean
clean:
	@echo "Removing venv and venv-tools. Don't forget to deactivate..."
	@rm -rf venv
	@rm -rf venv-tools
	@rm -rf flare_splunk_integration/bin/vendor
	@echo "Done."

.PHONY: package
package:
	-@rm flare_splunk_integration.tar.gz
	@echo "Packaging app..."
	@package
	@echo "Done."

.PHONY: validate
validate: venv-tools
	@echo "Running Splunk AppInspect..."
	@echo "If you get an error about \"libmagic\", run \"brew install libmagic\""
	venv-tools/bin/splunk-appinspect inspect --ci "flare_splunk_integration"

.PHONY: test
test: venv-tools
	venv-tools/bin/pytest -vv

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
splunk-local:
	@echo "Create symlink from app to Splunk Enterprise"
	@if [ ! -d "/Applications/Splunk/etc/apps" ]; then \
		echo "Splunk Enterprise isn't installed"; \
		exit 1; \
	fi

	@unlink "/Applications/Splunk/etc/apps/flare_splunk_integration" || true
	@ln -s "$(CURDIR)/flare_splunk_integration" "/Applications/Splunk/etc/apps/flare_splunk_integration"
