# ─── Variables ───────────────────────────────────────────────────────────────
PYTHON      ?= python
STAGE       := packages/flare/stage
DIST        := dist
APP_BIN_LIB := packages/flare/src/main/resources/splunk/bin/lib

# ─── Aggregate pipeline (mirrors CI: produce then verify) ────────────────────
.PHONY: ci
ci: package venv-tools lint validate test

# ─── Dependencies ────────────────────────────────────────────────────────────
# JS deps. File target so `pnpm install` only runs when manifests change.
node_modules: package.json pnpm-lock.yaml
	pnpm install
	@touch node_modules

# Python tooling venv (pytest / mypy / ruff / splunk-appinspect).
venv-tools: requirements.tools.txt
	rm -rf venv-tools
	$(PYTHON) -m venv venv-tools
	venv-tools/bin/pip install --upgrade pip
	venv-tools/bin/pip install -r requirements.tools.txt

# ─── Build & package ─────────────────────────────────────────────────────────
# Compile the frontend into packages/flare/stage (webpack also copies the
# Splunk app skeleton from src/main/resources/splunk into stage).
.PHONY: build
build: node_modules
	pnpm -r build

# Vendor the Python runtime deps into stage/bin/lib and emit dist/*.tgz.
.PHONY: package
package: build
	./package.sh

# ─── Distribution ────────────────────────────────────────────────────────────
.PHONY: publish
publish:
	@pkg=$$(ls -t $(DIST)/*.tgz 2>/dev/null | head -1); \
	if [ -z "$$pkg" ]; then echo "No package found in $(DIST)/. Run 'make package' first."; exit 1; fi; \
	echo "Publishing $$pkg to Splunkbase..."; \
	curl -u $$SPLUNKBASE_CREDS --request POST \
		https://splunkbase.splunk.com/api/v1/app/7602/new_release/ \
		-F "files[]=@$$pkg" \
		-F "filename=flare.tgz" \
		-F "splunk_versions=9.3,9.4" \
		-F "visibility=true"

.PHONY: validate
validate: venv-tools
	@echo "Running Splunk AppInspect..."
	@echo "If you get an error about \"libmagic\", run \"brew install libmagic\""
	@pkg=$$(ls -t $(DIST)/*.tgz 2>/dev/null | head -1); \
	if [ -z "$$pkg" ]; then echo "No package found in $(DIST)/. Run 'make package' first."; exit 1; fi; \
	venv-tools/bin/splunk-appinspect inspect --ci "$$pkg" ; \
	status=$$? ; \
	if [ "$$status" -eq 0 ] || [ "$$status" -eq 102 ] || [ "$$status" -eq 103 ] ; then \
		exit 0 ; \
	else \
		exit 1 ; \
	fi

# This is helpful for identifying tags that are emitting warnings
TAGS = advanced_xml alert_actions_conf ast bias cloud csv custom_search_commands custom_search_commands_v2 custom_visualizations custom_workflow_actions deprecated_feature developer_guidance django_bindings future java jquery manual markdown migration_victoria modular_inputs offensive packaging_standards private_app private_classic private_victoria pura python3_version removed_feature restmap_config savedsearches security spec splunk_5_0 splunk_6_0 splunk_6_1 splunk_6_2 splunk_6_3 splunk_6_4 splunk_6_5 splunk_6_6 splunk_7_0 splunk_7_1 splunk_7_2 splunk_7_3 splunk_8_0 splunk_9_0 splunk_appinspect web_conf windows
.PHONY: inspect-tags
inspect-tags: venv-tools
	@pkg=$$(ls -t $(DIST)/*.tgz 2>/dev/null | head -1); \
	if [ -z "$$pkg" ]; then echo "No package found in $(DIST)/. Run 'make package' first."; exit 1; fi; \
	for TAG in $(TAGS); do \
		echo "Tag: $$TAG" ; \
		venv-tools/bin/splunk-appinspect inspect --ci --included-tags $$TAG "$$pkg" ; \
	done

# ─── Quality ─────────────────────────────────────────────────────────────────
.PHONY: test
test: node_modules
	pnpm -r test

.PHONY: lint
lint: node_modules venv-tools mypy format-check
	pnpm -r lint

.PHONY: mypy
mypy: venv-tools
	venv-tools/bin/mypy --config-file mypy.ini packages/flare

.PHONY: format
format: venv-tools node_modules
	pnpm run format

.PHONY: format-check
format-check: venv-tools node_modules
	pnpm run format:verify

# ─── Local development ───────────────────────────────────────────────────────
.PHONY: sl
sl: splunk-local

# Assemble a runnable app in stage/ (frontend + vendored Python), then run it in
# a local Splunk container (compose mounts packages/flare/stage) with a watcher.
.PHONY: splunk-local
splunk-local: build
	SKIP_TARBALL=1 ./package.sh
	docker compose up -d
	pnpm run start

# ─── Housekeeping ────────────────────────────────────────────────────────────
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf venv-tools
	rm -rf $(DIST)
	rm -rf $(STAGE)
	rm -rf $(APP_BIN_LIB)
	@find . -type d -name "node_modules" -exec rm -rf {} +
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@echo "Done."
