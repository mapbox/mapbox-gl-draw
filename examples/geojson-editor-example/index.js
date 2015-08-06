/* global React, map, Draw */
var extent = require('turf-extent');

class App extends React.Component { // eslint-disable-line

  constructor() {
    super();
    this.state = {
      geojson: {
        type: 'FeatureCollection',
        features: []
      }
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

        <input
          placeholder='Fetch data from URL here, write geojson below, or draw. Whatever makes you happy.'
          type='text'
          style={{ width: '100%', height: '30px', fontSize: '15px' }}
          onChange={this.fetchURL}
        />

        <textarea
          type='text'
          style={{ height: '100%', width: '100%', fontSize: '15px' }}
          onChange={this.setMap}
          value={JSON.stringify(this.state.geojson, null, 4)}
        >
        </textarea>

      </div>
    );
  }

}

React.render(<App />, document.getElementById('geojson'));
