/**
 * Mapbox dataset API Client
 */

const URL = 'https://api.mapbox.com/datasets/v1/';
const POST = 'post';
const DELETE = 'delete';
const PUT = 'put';

export default class Client {

  constructor(app, account, token) {
    this.app = app;
    this.acct = account;
    this.token = token;
    this.list();
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
      for (var key in params) {
        endpoint += params[key] + '/';
      }
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
    return this;
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
      });
    return this;
  }

  get(id) {
    if (!this.acct || !this.token) return;
    fetch(this.url({ endpoint: id + '/features' }))
      .then(res => {
        return res.json();
      })
      .then(data => {
        this.app.setGeoJSON(data);
      });
    return this;
  }

  save(/*id, geojson*/) {

  }

  destroy(id) {
    fetch(this.url({ endpoint: id }), {
      method: DELETE
    })
      .then(res => {
        if (res.ok) this.list();
        else return res.json();
      })
      .then(res => {
        this.list();
        console.log(res);
      });
    return this;
  }

  newFeature(dataset, geojson) {
    fetch(this.url({ endpoint: dataset }), {
      method: PUT,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geojson)
    })
      .then(res => {
        if (res.ok) this.list();
        else return res.json();
      })
      .then(res => {
        this.list();
        console.log(res);
      });
    return this;
  }

  updateFeature(dataset, geojson) {
    fetch(this.url({ endpoint: dataset }), {
      method: PUT,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geojson)
    })
      .then(res => {
        if (res.ok) this.list();
        else return res.json();
      })
      .then(err => {
        this.list();
        console.log(err);
      });
    return this;
  }

}

