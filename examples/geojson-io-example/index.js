/* global React, map, Draw */
var extent = require('turf-extent');

class App extends React.Component { // eslint-disable-line

  constructor() {
    super();
    this.state = {
      geojson: {
        type: 'FeatureCollection',
        features: []
      },
      mode: 'text'
    };
  }

  componentWillMount() {
    map.on('draw.feature.update', function(e) {
      this.setState({ geojson: e.geojson });
    }.bind(this));
  }

  setMap(e) {
    this.setState({ geojson: JSON.parse(e.target.value) });
  }

  toggleMode(mode) {
    this.setState({ mode: mode });
  }

  fetchURL(e) {
    var req = new XMLHttpRequest();
    req.open('GET', e.target.value);
    req.onload = () => {
      var data = JSON.parse(req.responseText);
      Draw.update(data);
      var ext = extent(data);
      map.fitBounds([[ext[1], ext[0]], [ext[3], ext[2]]]);
    };
    req.send();
  }

  render() {
    return (
      <div style={{ height: '100%', width: '100%' }}>

        <div>
          <button onClick={this.toggleMode.bind(this, 'text')}>Text</button>
          <button onClick={this.toggleMode.bind(this, 'url')}>URL</button>
        </div>

        {this.state.mode === 'text' && <textarea
          type='text'
          style={{ height: '100%', width: '100%' }}
          onChange={this.setMap}
          value={JSON.stringify(this.state.geojson, null, 4)}
        >
        </textarea>}

        {this.state.mode === 'url' && <input
          type='text'
          style={{ width: '100%' }}
          onChange={this.fetchURL}
        />}

      </div>
    );
  }

}

React.render(<App />, document.getElementById('geojson'));
