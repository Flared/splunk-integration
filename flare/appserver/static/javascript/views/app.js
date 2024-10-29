import * as Setup from "./setupConfiguration.js";

define(["react", "splunkjs/splunk"], function (react, splunkSdk) {
    const e = react.createElement;

    class SetupPage extends react.Component {
        constructor(props) {
            super(props);

            this.state = {
                serverKey: '',
                tenantId: '',
                tenants: [],
                errorMessage: '',
                isLoading: false,
            };

            this.handleChangeServerKey = this.handleChangeServerKey.bind(this);
            this.handleChangeTenantId = this.handleChangeTenantId.bind(this);
            this.handleSubmitServerKey = this.handleSubmitServerKey.bind(this);
            this.handleSubmitTenant = this.handleSubmitTenant.bind(this);
        }

        handleChangeServerKey(event) {
            this.setState({ ...this.state, ["serverKey"]: event.target.value });
        }

        handleChangeTenantId(event) {
            this.setState({ ...this.state, ["tenantId"]: event.target.value });
        }

        async handleSubmitServerKey(event) {
            event.preventDefault();
            this.setState({ ...this.state, ["isLoading"]: true });
            Setup.retrieveUserTenants(splunkSdk, this.state.serverKey, (user_tenants) => {
                if (this.state.tenantId === '' && user_tenants.tenants.length > 0) {
                    this.state.tenantId = user_tenants.tenants[0].id;
                }
                this.state.errorMessage = '';
                this.setState({ ...this.state, ["tenants"]: user_tenants.tenants });
                this.setState({ ...this.state, ["isLoading"]: false });
            }, (error) => {
                this.setState({ ...this.state, ["errorMessage"]: error });
                this.setState({ ...this.state, ["isLoading"]: false });
            });
        }

        async handleSubmitTenant(event) {
            event.preventDefault();
            this.setState({ ...this.state, ["isLoading"]: true });
            await Setup.saveConfiguration(splunkSdk, this.state.serverKey, this.state.tenantId);
        }

        componentDidMount() {
            this.setState({ ...this.state, ["isLoading"]: true });
            Setup.retrieveServerKey(splunkSdk).then((serverKey) => {
                this.setState({ ...this.state, ["serverKey"]: serverKey });
                Setup.retrieveTenantId(splunkSdk).then((tenantId) => {
                    this.setState({ ...this.state, ["tenantId"]: tenantId });
                    this.setState({ ...this.state, ["isLoading"]: false });
                });
            });
        }

        render() {
            if (this.state.isLoading) {
                return e('div', null, 'Loading...');
            }

            if (this.state.tenants.length == 0 || this.state.serverKey == '') {
                return e("div", null, [
                    e("h2", null, "Enter your API Key"),
                    e("p", null, "A new API Key can be generated by going on your profile page in Flare"),
                    e("p", { class: "error" }, this.state.errorMessage),
                    e("div", null, [
                        e("form", { onSubmit: this.handleSubmitServerKey }, [
                            e("label", null, [
                                "Server API Key ",
                                e("input", { type: "password", name: "serverKey", value: this.state.serverKey, onChange: this.handleChangeServerKey })
                            ]),
                            e("input", { type: "submit", value: "Next Step" })
                        ])
                    ])
                ]);
            } else {
                const tenantOptions = [];
                for (let i = 0; i < this.state.tenants.length; i++) {
                    tenantOptions.push(
                        e('option', { key: i, value: this.state.tenants[i].id }, this.state.tenants[i].name)
                    );
                }
                return e("div", null, [
                    e("h2", null, "Please select the Tenant you want to ingest events from"),
                    e("p", { class: "error" }, this.state.errorMessage),
                    e("div", null, [
                        e("form", { onSubmit: this.handleSubmitTenant }, [
                            e(
                                'select',
                                { name: 'tenantsDropdown', value: this.state.tenantId, onChange: this.handleChangeTenantId },
                                ...tenantOptions
                            ),
                            e("br"),
                            e("input", { type: "submit", value: "Submit" })
                        ])
                    ])
                ]);
            }
        }

    }

    return e(SetupPage);
});