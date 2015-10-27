const url = 'https://api.mapbox.com/datasets/v1/';
//const GET = 'GET';
//const POST = 'POST';

export default class Datasets {

  constructor(account, token) {
    this.acct = account;
    this.token = token;
  }

  setAccount(account) {
    this.acct = account;
  }

  list() {
    fetch(`${url}${this.acct}?access_token=${this.token}`).
      then((res) => {
        console.log(res);
      }).catch((err) => {
        console.log(err);
      });
  }

  create() {

  }

}
