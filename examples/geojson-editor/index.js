/* global map, Draw */
import React from 'react';
import ReactDOM from 'react-dom';
import extent from 'turf-extent';
import GJV from 'geojson-validation';
import Client from './client';

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
      geojsonEditPane: false,
      mode: MAPBOX,
      settings: true,
      validURL: true,
      view: 'draw',
      datasets: [],
      datasetId: null,
      featureId: null
    };
    this.client = new Client(this);
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

  setDatasets(datasets) {
    this.setState({ datasets });
  }

  setGeoJSON(geojson) {
    this.setState({
      geojson,
      input: JSON.stringify(geojson, null, 4),
      geojsonEditPane: true
    });
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
          this.setState({ validURL: false });
          console.log('could not parse json');
        }
      })
      .then((data) => {
        this.setState({ validURL: true, view: 'draw' });
        Draw.clear().set(data);
        var ext = extent(data);
        map.fitBounds([[ext[0], ext[1]], [ext[2], ext[3]]]);
      })
      .catch((err) => {
        console.log(err);
        this.setState({ validURL: false });
      });
  }

  toggleSettings() {
    this.setState({ settings: !this.state.settings });
  }

  toggleGeojsonEditPane() {
    this.setState({ geojsonEditPane: !this.state.geojsonEditPane });
  }

  toggleView(view) {
    this.setState({ view });
  }

  setMode(mode) {
    this.setState({ mode });
  }

  setToken(e) {
    this.client.setToken(e.target.value);
  }

  setAccount(e) {
    this.client.setAccount(e.target.value);
  }

  setDataset(datasetId) {
    this.setState({ datasetId });
  }

  createDataset() {
    this.client.create(this.refs['newDatasetName'].value); // eslint-disable-line dot-notation
  }

  editDataset(datasetId) {
    this.setState({ datasetId });
    this.client.get(datasetId);
  }

  addFeature() {
    Draw.clear();
  }

  deleteDataset(id) {
    this.client.destroy(id);
  }

  save() {
    var geojson = this.state.geojson;
    var id = geojson.features[0].properties.drawId;
    geojson.features[0].id = id;
    this.client.updateFeature(id, geojson.features[0]);
    this.setState({ geojson });
  }

  render() {
    var input = this.state.input;
    return (
      <div className='side-bar'>

        <div className='clearfix col12 pad1' onClick={this.toggleSettings.bind(this)}>
          <span className='col1 icon sprocket'></span>
          <h3 className='col10'>Control Panel</h3>
          <span className={`col1 icon caret-${this.state.settings ? 'down' : 'left' }`}></span>
        </div>

        {this.state.settings && <div className='clearfix'>

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

          {this.state.mode === MAPBOX && <div>
            <fieldset className='with-icon dark'>
              <span className='icon mapbox'></span>
              <input
                placeholder='Mapbox Username'
                type='text'
                className='stretch'
                onChange={this.setAccount.bind(this)}
              />
            </fieldset>

            <fieldset className='with-icon dark'>
              <span className='icon lock'></span>
              <input
                placeholder='Mapbox Dataset API access token'
                type='text'
                className='stretch'
                onChange={this.setToken.bind(this)}
              />
            </fieldset>

            {this.state.datasets.length > 0 && <div className='keyline-bottom pad1 clearfix'>
              <div className='keyline-bottom pad1 clearfix'>
                <h3>My Datasets</h3>
              </div>
              <div className='clearfix'>
                {this.state.datasets.map((set, k) => <div
                  key={k}
                  className={`clearfix col12 pad2 ${this.state.datasetId === set.id && 'fill-dark dark'}`}
                  onClick={this.setDataset.bind(this, set.id)}
                >
                  <div className='col9'>{set.name}</div>
                  <span onClick={this.editDataset.bind(this, set.id)} className='col1 icon pencil'></span>
                  <span onClick={this.addFeature.bind(this)} className='col1 icon plus'></span>
                  <span onClick={this.deleteDataset.bind(this, set.id)} className='col1 icon close'></span>
                  {this.state.datasetId === set.id && <div>
                    <ul>
                      {this.state.geojson.features.map((feature, i) => <li key={i}>{feature.type}</li>)}
                    </ul>
                  </div>}
                </div>)}
              </div>
            </div>}

            <div className='keyline-bottom pad1 clearfix'>
              <div className='keyline-bottom pad1'>
                <h3>Create New Dataset</h3>
              </div>
              <div className='clearfix col12'>
                <div className='clearfix pad1 col10'>
                  <input
                    placeholder='Dataset name'
                    type='text'
                    className='stretch'
                    ref='newDatasetName'
                  />
                </div>
                <div className='pad1 clearfix col2'>
                  <button className='button' onClick={this.createDataset.bind(this)}>
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>}

          {this.state.mode === NORM && <div>
            <fieldset className={`with-icon dark ${!this.state.validURL && 'fill-red'}`}>
              <span className='icon search'></span>
              <input
                placeholder='Fetch data from URL'
                type='text'
                className={`url-input stretch ${!this.state.validURL && 'fill-red'}`}
                onChange={this.fetchURL}
              />
            </fieldset>
          </div>}

        </div>}

        <div className='clearfix col12 pad1' onClick={this.toggleGeojsonEditPane.bind(this)}>
          <span className='col1 icon pencil'></span>
          <h3 className='col10'>Editor</h3>
          <span className={`col1 icon caret-${this.state.geojsonEditPane ? 'down' : 'left' }`}></span>
        </div>

        {this.state.geojsonEditPane && <div className='clearfix'>
          <div className='rounded-toggle col12 inline'>
            <input
              id='draw'
              type='radio'
              name='rtoggle'
              value='draw'
              checked={this.state.view === 'draw' && 'checked'}
              readOnly={true}
            />
            <label
              htmlFor='draw'
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
              readOnly={true}
            />
            <label
              htmlFor='edit'
              className='col6 center'
              onClick={this.toggleView.bind(this, 'edit')}
            >
              Editting
            </label>
          </div>

          {this.state.view === 'draw' && <div className='clearfix'>
            <textarea
              type='text'
              className='geojson-input fill-navy dark col12 row6'
              onChange={this.setMap}
              value={input}
            />
          </div>}

          {this.state.view === 'edit' && <div className='clearfix'>
            <textarea
              type='text'
              className='geojson-input fill-navy dark col12 row6'
              value={this.state.editting}
            />
          </div>}
          <div className='clearfix'>
            <button className='button fill-green fr' onClick={this.save.bind(this)}>
              <span className='icon floppy'></span>
              Save
            </button>
          </div>
        </div>}

      </div>
    );
  }

}

ReactDOM.render(<App />, document.getElementById('geojson'));

