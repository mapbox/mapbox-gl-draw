var React = require('react');
var Immutable = require('immutable');
var darkStyle = require('./dark-v7.json');
var drawLayers = require('./draw_layers.js');

var getFeature = function(type, active) {
  return Immutable.fromJS({
    type: 'Feature',
    properties: {},
    geometry: {
      type: type,
      coordinates: type === 'Polygon' ? [active] :
        type === 'LineString' ? active :
        active.toJS()[0]
    }
  });
};

var bakeData = function(type, active, features) {
  return {
    type: 'FeatureCollection',
    features: features.push(getFeature(type, active)).toJS()
  };
};

var App = React.createClass({
  getInitialState() {
    return {
      type: false,
      features: Immutable.List(),
      activeCoordinates: Immutable.List(),
      activePoint: Immutable.List()
    };
  },
  componentDidMount() {
    window.addEventListener('keyup', this.keybinding);

    mapboxgl.accessToken = 'pk.eyJ1IjoiZWRlbmhhbHBlcmluIiwiYSI6IlFRZG0zMWMifQ.QUNKx4tIMjZfwmrE8SE6Bg';

    this.map = new mapboxgl.Map({
      container: this.refs.map.getDOMNode(),
      hash: true,
      style: darkStyle
    });

    this.sourceObj = new mapboxgl.GeoJSONSource ({
      data: bakeData('Point', Immutable.fromJS([0, 0]), this.state.features)
    });

    this.map.on('load', () => {
      darkStyle.layers = darkStyle.layers.concat(drawLayers);
      this.map.setStyle(darkStyle);
      this.map.addSource('draw', this.sourceObj);
    });
    this.map.on('click', this.onClick);
    this.map.on('hover', this.onHover);
  },
  componentWillUnmount() {
    window.removeEventListener('keyup', this.keybinding);
  },
  keybinding(e) {
    if (e.which === 27) {
      if (this.state.type !== 'Point') this.endFeature(this.state.type);
      this.setState({ type: false });
    }
  },
  toggleType(type, e) {
    e.preventDefault();
    this.setState({ type: this.state.type === type ? false : type });
  },
  onClick(e) {
    if (!this.state.type) return;
    this.setState({
      activeCoordinates: this.state.activeCoordinates.push(this.state.activePoint)
    });
    if (this.state.type === 'Point') {
      this.endFeature(this.state.type);
    } else {
      this.setData(true);
    }
  },
  onHover(e) {
    if (!this.state.type) return;
    var point = this.map.unproject([e.point.x, e.point.y]);
    this.setState({ activePoint: Immutable.fromJS([point.lng, point.lat]) });
    this.setData();
  },
  setData(click) {
    var active = this.state.activeCoordinates;
    if (!click) active = active.push(this.state.activePoint);
    this.sourceObj.setData(
      bakeData(this.state.type, active, this.state.features));
  },
  endFeature(type) {
    var active = this.state.activeCoordinates;
    if (type === 'Polygon') active = active.push(this.state.activeCoordinates.first());

    this.sourceObj.setData(
      bakeData(type, active, this.state.features));

    this.setState({
      activeCoordinates: Immutable.List(),
      activePoint: Immutable.List(),
      features: this.state.features.push(getFeature(type, active))
    });
  },
  render() {
    return (
      <div>
        <div className='pin-topleft pad1 z10'>
          <div className='fl pad1'>
            <a href='#'
              onClick={this.toggleType.bind(this, 'Point')}
              className={'pad1 icon marker quiet dark space-bottom1 block ' +
                (this.state.type === 'Point' ? 'fill-blue' : 'fill-dark')}></a>
            <a href='#'
              onClick={this.toggleType.bind(this, 'Polygon')}
              className={'pad1 icon polygon quiet fill-dark dark space-bottom1 block ' +
                (this.state.type === 'Polygon' ? 'fill-blue' : 'fill-dark')}></a>
            <a href='#'
              onClick={this.toggleType.bind(this, 'LineString')}
              className={'pad1 icon polyline quiet fill-dark dark space-bottom1 block ' +
                (this.state.type === 'LineString' ? 'fill-blue' : 'fill-dark')}></a>
          </div>
          {this.state.type && <div className='fl pad1x pad2y strong dark'>'Esc' to end</div>}
        </div>
        <div ref='map'
          className='pin-top pin-bottom col12'
          style={{
            cursor: this.state.type ? 'crosshair' : 'auto'
          }}></div>
      </div>
    );
  }
});

React.render(<App />, document.getElementById('app'));
