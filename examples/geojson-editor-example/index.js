/* global React, map, Draw, turf */
import GJV from 'geojson-validation';

class App extends React.Component { // eslint-disable-line

  constructor(props) {
    super(props);
    this.state = {
      geojson: {
        type: 'FeatureCollection',
        features: []
      },
      view: 'draw'
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

    map.on('edit.feature.update', function() {
      this.setState({ view: 'edit' });
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

  toggleView(target) {
    this.setState({ view: target });
  }

  render() {
    var input = this.state.input;
    var editting = JSON.stringify(Draw.getEditting(), null, 4);
    return (
      <div className='side-bar'>

        <fieldset className='with-icon dark'>
          <span className='icon search'></span>
          <input
            placeholder='Fetch data from URL here, write geojson below, or draw'
            type='text'
            className='url-input stretch'
            onChange={this.fetchURL}
          />
        </fieldset>

        <div className='rounded-toggle col12 inline'>
          <input
            id='draw'
            type='radio'
            name='rtoggle'
            value='draw'
            checked={this.state.view === 'draw' && 'checked'}
          />
          <label
            for='draw'
            className='col6 center'
            onClick={this.toggleView.bind(this, 'draw')}
          >
            Drawn
          </label>
          <input
            id='edit'
            type='radio'
            name='rtoggle'
            value='edit'
            checked={this.state.view === 'edit' && 'checked'}
          />
          <label
            for='edit'
            className='col6 center'
            onClick={this.toggleView.bind(this, 'edit')}
          >
            Editting
          </label>
        </div>

        {this.state.view === 'draw' && <textarea
          type='text'
          className='geojson-input fill-navy dark'
          onChange={this.setMap}
          value={input}
        />}

        {this.state.view === 'edit' && <textarea
          type='text'
          className='geojson-input fill-navy dark'
          value={editting}
        />}

      </div>
    );
  }

}

React.render(<App />, document.getElementById('geojson'));
