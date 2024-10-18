.PHONY: build
build:
	$(MAKE) clean
	$(MAKE) venv

venv:
	python -m venv venv
	venv/bin/pip install --upgrade pip
	venv/bin/pip install -r "ci/requirements.txt"

.PHONY: clean
clean:
	@echo "Removing venv. Don't forget to deactivate..."
	@rm -rf venv
	@echo "Done."

.PHONY: package
package:
	-@rm flare_splunk_integration.tar.gz
	@echo "Packaging app..."
	@package
	@echo "Done."

.PHONY: validate
validate:
	@echo "Running Splunk AppInspect..."
	@echo "If you get an error about \"libmagic\", run \"brew install libmagic\""
	venv/bin/splunk-appinspect inspect --ci "flare_splunk_integration"

.PHONY: test
test: venv
	venv/bin/pytest -vv

.PHONY: format
format: venv
	venv/bin/ruff check --fix --unsafe-fixes
	venv/bin/ruff format

.PHONY: format-check
format-check: venv
	venv/bin/ruff check
	venv/bin/ruff format --check

.PHONY: lint
lint: mypy format-check

.PHONY: mypy
mypy: venv
	venv/bin/mypy flare_splunk_integration