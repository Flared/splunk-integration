APP_ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

.PHONY: venv
venv:
	@echo "Creating venv and installing from requirements.txt..."
	@python -m venv venv && pip install -r "${APP_ROOT}requirements.txt"
	@echo "Done."

.PHONY: freeze
freeze:
	@echo "Feezing current venv..."
	@pip freeze > requirements.txt
	@echo "Done."

.PHONY: clean
clean:
	@rm -rf env
	@echo "Done."

.PHONY: package
package:
	-@rm flare_splunk_integration.tar.gz
	@echo "Packaging app..."
	@COPYFILE_DISABLE=1 tar --format ustar -cvzf flare_splunk_integration.tar.gz flare_splunk_integration
	@echo "Done."

.PHONY: validate
validate:
	@echo "Running Splunk AppInspect..."
	@echo "If you get an error about \"libmagic\", run \"brew install libmagic\""
	@splunk-appinspect inspect "${APP_ROOT}flare_splunk_integration"