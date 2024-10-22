import * as Setup from "./setupConfiguration.js";

define(["react", "splunkjs/splunk"], function(react, splunkSdk){
  const e = react.createElement;

  class SetupPage extends react.Component {
    constructor(props) {
      super(props);

      this.state = {
        serverKey: '',
        tenantId: '',
      };

      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
      this.setState({ ...this.state, [event.target.name]: event.target.value});
    }

    async handleSubmit(event) {
      event.preventDefault();

      await Setup.saveConfiguration(splunkSdk, this.state.serverKey, this.state.tenantId);
    }
    render() {
      return e("div", null, [
        e("h2", null, "Add a server key and tenant ID to complete app setup."),
        e("div", null, [
          e("form", { onSubmit: this.handleSubmit }, [
            e("label", null, [
              "Server API Key ",
              e("input", { type: "password", name: "serverKey", value: this.state.serverKey, onChange: this.handleChange })
            ]),
            e("label", null, [
              "Tenant ID ",
              e("input", { type: "number", name: "tenantId", value: this.state.tenantId, onChange: this.handleChange })
            ]),
            e("input", { type: "submit", value: "Submit" })
          ])
        ])
      ]);
    }
  
  }

  return e(SetupPage);
});
