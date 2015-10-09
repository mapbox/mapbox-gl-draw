/* global React, map, Draw, turf */
import GJV from 'geojson-validation';

class App extends React.Component { // eslint-disable-line

  constructor(props) {
    super(props);
    this.state = {
      geojson: {
        type: 'FeatureCollection',
        features: []
      }
    };
    this.state.input = JSON.stringify(this.state.geojson, null, 4);
    this.state.valid = true;
    this.setMap = this.setMap.bind(this);
  }

  componentWillMount() {
    map.on('draw.feature.update', function(e) {
      this.setState({
        geojson: e.geojson,
        input: JSON.stringify(e.geojson, null, 4)
      });
    }.bind(this));
  }

  setMap(e) {
    try {
      this.setState({
        input: e.target.value,
        geojson: JSON.parse(e.target.value),
        valid: true
      }, () => {
        if (GJV.valid(this.state.geojson)) {
          Draw.clear();
          Draw.set(this.state.geojson);
        }
      });
    } catch (err) {
      this.setState({
        input: e.target.value,
        valid: false
      });
    }
  }

  fetchURL(e) {
    var req = new XMLHttpRequest();
    req.open('GET', e.target.value);
    req.onload = () => {
      var data = JSON.parse(req.responseText);
      Draw.clear();
      Draw.set(data);
      var ext = turf.extent(data);
      map.fitBounds([[ext[0], ext[1]], [ext[2], ext[3]]]);
    };
    req.send();
  }

  render() {
    var input = this.state.input;
    return (
      <div className='side-bar'>

        <fieldset className='with-icon dark col-12'>
        <span className='icon search'></span>
        <input
          placeholder='Fetch data from URL here, write geojson below, or draw'
          type='text'
          className='url-input col-12 stretch'
          onChange={this.fetchURL}
        />
        </fieldset>

        <textarea
          type='text'
          className='geojson-input fill-navy dark'
          onChange={this.setMap}
          value={input}
        />

      </div>
    );
  }

}

React.render(<App />, document.getElementById('geojson'));
