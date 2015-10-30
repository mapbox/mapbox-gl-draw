const url = 'https://api.mapbox.com/datasets/v1/';

export default class Client {

  constructor(account, token) {
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

  list() {
    fetch(`${url}${this.acct}?access_token=${this.token}`).
      then((res) => {
        return res.json();
      }).then(res => {
        console.log(res);
      }).catch((err) => {
        console.log(err);
      });
  }

  create() {

  }

}
