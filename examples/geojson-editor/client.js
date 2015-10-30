/**
 * Mapbox dataset API Client
 */
const URL = 'https://api.mapbox.com/datasets/v1/';
const POST = 'post';

export default class Client {

  constructor(app, account, token) {
    this.app = app;
    this.acct = account;
    this.token = token;
  }

  setAccount(account) {
    this.acct = account;
    if (this.token && this.acct) {
      this.list();
    }
    return this;
  }

  getAccount() {
    return this.acct;
  }

  setToken(token) {
    this.token = token;
    if (this.token && this.acct) {
      this.list();
    }
    return this;
  }

  getToken() {
    return this.token;
  }

  url(params) {
    var endpoint = '';
    if (params) {
      endpoint = params.endpoint || '';
    }
    return `${URL}${this.acct}/${endpoint}?access_token=${this.token}`;
  }

  list() {
    fetch(this.url())
      .then((res) => {
        return res.json();
      })
      .then(data => {
        this.app.setDatasets(data);
      })
      .catch(err => {
        console.log(err);
      });
  }

  create(name) {
    if (!this.acct || !this.token) return;
    fetch(this.url(), {
      method: POST,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })
      .then(() => {
        this.list();
      })
      .catch(err => {
        console.log(err);
      });
  }

  get(id) {
    if (!this.acct || !this.token) return;
    fetch(this.url({ endpoint: id + '/features' }))
      .then(res => {
        return res.json();
      })
      .then(data => {
        this.app.setFeoJSON(data);
      })
      .catch(err => {
        console.log(err);
      });
  }

}
