/* global React, map, Draw, turf */
import GJV from 'geojson-validation';
//import Dataset from './dataset';

const MAPBOX = 1;
const NORM = 2;

class App extends React.Component { // eslint-disable-line

  constructor(props) {
    super(props);
    this.state = {
      geojson: {
        type: 'FeatureCollection',
        features: []
      },
      mode: MAPBOX,
      settings: true,
      validURL: true,
      view: 'draw'
    };
    this.state.input = JSON.stringify(this.state.geojson, null, 4);
    this.state.valid = true;
    this.setMap = this.setMap.bind(this);
    this.fetchURL = this.fetchURL.bind(this);
  }

  componentWillMount() {
    map.on('draw.feature.update', function(e) {
      this.setState({
        geojson: e.geojson,
        input: JSON.stringify(e.geojson, null, 4)
      });
    }.bind(this));

    map.on('edit.feature.update', function(e) {
      this.setState({ editting: JSON.stringify(Draw.getEditting(), null, 4) });
      if (e.geojson.features.length)
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
    fetch(e.target.value)
      .then((res) => {
        try {
          return res.json();
        } catch (err) {
          console.log(err);
          this.setState({ validURL: false });
        }
      }).then((data) => {
        this.setState({ validURL: true });
        Draw.clear();
        Draw.set(data);
        this.setState({ view: 'draw' });
        var ext = turf.extent(data);
        map.fitBounds([[ext[0], ext[1]], [ext[2], ext[3]]]);
      }).catch((err) => {
        console.log(err);
        this.setState({ validURL: false });
      });
  }

  toggleSettings() {
    this.setState({ settings: !this.state.settings });
  }

  toggleView(view) {
    this.setState({ view });
  }

  setMode(mode) {
    this.setState({ mode });
  }

  render() {
    var input = this.state.input;
    return (
      <div className='side-bar'>

        <div className='clearfix col12 pad1' onClick={this.toggleSettings.bind(this)}>
          <span className='col1 icon sprocket'></span>
          <div className='col10'>Settings</div>
          <span className={`col1 icon caret-${this.state.settings ? 'down' : 'left' }`}></span>
        </div>

        {this.state.settings && <div>

          <div className='col12 clearfix'>
            <div
              className={`col6 center pad1 ${this.state.mode === MAPBOX && 'fill-darken1'}`}
              onClick={this.setMode.bind(this, MAPBOX)}
            >
              Mapbox
            </div>
            <div
              className={`col6 center pad1 ${this.state.mode === NORM && 'fill-darken1'}`}
              onClick={this.setMode.bind(this, NORM)}
            >
              Fetch
            </div>
          </div>

          {this.state.mode === MAPBOX && <fieldset className='with-icon dark'>
            <span className='icon mapbox'></span>
            <input
              placeholder='Mapbox Username'
              type='text'
              className='stretch'
            />
          </fieldset>}

          {this.state.mode === MAPBOX && <fieldset className='with-icon dark'>
            <span className='icon lock'></span>
            <input
              placeholder='Mapbox Dataset API access token'
              type='text'
              className='stretch'
            />
          </fieldset>}

          {this.state.mode === NORM && <div>
            {!this.state.validURL && <div className='red'>Invalid URL</div>}
            <fieldset className='with-icon dark'>
              <span className='icon search'></span>
              <input
                placeholder='Fetch data from URL'
                type='text'
                className='url-input stretch'
                onChange={this.fetchURL}
              />
            </fieldset>
          </div>}

        </div>}

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
          value={this.state.editting}
        />}

      </div>
    );
  }

}

React.render(<App />, document.getElementById('geojson'));
