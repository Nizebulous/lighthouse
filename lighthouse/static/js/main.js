"use strict";

var EventEmitter = require("events").EventEmitter;
var dispatcher = require("./dispatcher");
var ReactDOM = require('react-dom');
var assign = require('object-assign');

// React-Bootstrap
var Nav = require('react-bootstrap/lib/Nav');
var NavItem = require('react-bootstrap/lib/NavItem');
var NavDropdown = require('react-bootstrap/lib/NavDropdown');
var MenuItem = require('react-bootstrap/lib/MenuItem');
var Grid = require('react-bootstrap/lib/Grid');
var Row = require('react-bootstrap/lib/Row');
var Col = require('react-bootstrap/lib/Col');
var PageHeader = require('react-bootstrap/lib/PageHeader');
var PanelGroup = require('react-bootstrap/lib/PanelGroup');
var Panel = require('react-bootstrap/lib/Panel');
var Button = require('react-bootstrap/lib/Button');
var Label = require('react-bootstrap/lib/Label');
var Table = require('react-bootstrap/lib/Table');
var Modal = require('react-bootstrap/lib/Modal');
var Input = require('react-bootstrap/lib/Input');

const innerCheckbox = <input type='checkbox' name='port' aria-label="..." />;

var PortInput = React.createClass({

    // regex for validating port input
    validationRegex: /^(\b\d+(:\d+?)?\b ?)*$/,

    getInitialState: function() {
        return {
            style: ''
        };
    },

    _onChange: function(event) {
        console.log(event.currentTarget.value);
        if (event.currentTarget.value == '') {
            this.setState({style: ''});
        } else if (this.validationRegex.test(event.currentTarget.value)) {
            this.setState({style: 'success'});
        } else {
            this.setState({style: 'error'});
        }
    },

    render: function() {
        var props = {
            type: 'text',
            name: 'ports',
            label: 'ports',
            help: 'Enter port config, leave blank for default(ex: <containerPort> <host>:<container>)'
        };
        if (this.state.style != '') {
            props.bsStyle = this.state.style;
        }
        return (
            <Input {...props} onChange={this._onChange} addonBefore={innerCheckbox} hasFeedback />
        );
    }
});

var Config = React.createClass({

    getInitialState: function() {
        return { 
            showModal: false ,
        };
    },

    close: function() {
        console.log('close');
        this.setState({ showModal: false });
    },

    open: function() {
        console.log('open');
        this.setState({ showModal: true });
    },

    render: function() {
        return (
            <div>
                <Button onClick={this.open}>
                    config
                </Button>
                <Modal show={this.state.showModal} onHide={this.close}>
                    <Modal.Header closeButton>
                        <Modal.Title>Run Configuration</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form>
                            <PortInput />
                            <Button bsStyle='primary' onClick={Actions.saveConfig}>Save</Button>
                        </form>
                    </Modal.Body>
                </Modal>
            </div>
        );
    }
});

var Image = React.createClass({

    LABELS: ['default', 'primary', 'success', 'info', 'warning', 'danger'],

    renderContainers: function(containers) {
        if (containers.length > 0) {
            return (
                <div>
                    {containers.map(function(container) {
                        return (<Container key={container.container_id} container={container} />);
                    })}
                </div>
            );
        } else {
            return (<span>No containers for this image</span>);
        }
    },

    renderRepos: function(repositories) {
        var entries = [];
        var index = 0;
        for (var repo in repositories) {
            repositories[repo].forEach(function(tag) {
                entries.push(<Label key={repo + tag} bsStyle={this.LABELS[index]}>{repo}:{tag}</Label>);
            }.bind(this));
            index++;
        }
        return (
            <div>
                {entries}
            </div>
        );
    },

    render: function() {
        var image = this.props.image;
        return (
            <Panel header={'Image ' + image.image_id} collapsible>
                <Config />
                <Table>
                    <thead><tr><th>Created</th><th>Virtual Size</th><th>Actions</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>{image.created_at} (6 days ago)</td>
                            <td>{image.virtual_size}</td>
                            <td>
                                {image.actions.map(function(action) {
                                    return (
                                        <button key={action.name} type="button" onClick={Actions.image_action.bind(this, image, action.name)}>
                                            {action.label}
                                        </button>
                                    );
                                })}
                            </td>
                        </tr>
                    </tbody>
                </Table>
                <div>
                    <h4>Tags</h4>
                    {this.renderRepos(image.repositories)}
                </div>
                <div>
                    <h4>Containers</h4>
                    {this.renderContainers(image.containers)}
                </div>
            </Panel>
        );
    },
});

var ImageList = React.createClass({
    getInitialState: function() {
        return this._getState();
    },

    componentDidMount: function() {
        DockerStore.addChangeListener(this._onChange);
    },

    componentsWillUnmount: function() {
        DockerStore.removeChangeListener(this._onChange);
    },

    _getState: function() {
        return {
            images: DockerStore.getImages(),
        };
    },

    _onChange: function() {
        this.setState(this._getState());
    },

    render: function() {
        return (
            <Panel header="Images">
                {this.state.images.map(function(image) {
                    return <Image key={image.image_id} image={image} />;
                })}
            </Panel>
        )
    }
});

var Container = React.createClass({

    propTypes: {
        container: React.PropTypes.object.isRequired
    },

    render: function() {
        var container = this.props.container;
        var bsStyle = '';
        if (container.status.startsWith('Up')) {
            bsStyle = 'success';
        } else {
            bsStyle = 'default';
        }
        console.log(container.ports);
        return (
            <Panel header={container.names + ' (' + container.container_id + ')'} bsStyle={bsStyle}>
                <Grid>
                    <Row>
                        <Col xs={3} md={2}>Command:</Col>
                        <Col>{container.command}</Col>
                    </Row>
                    <Row>
                        <Col xs={3} md={2}>Created:</Col>
                        <Col>{container.created_at} (6 days ago)</Col>
                    </Row>
                    <Row>
                        <Col xs={3} md={2}>Status:</Col>
                        <Col>{container.status}</Col>
                    </Row>
                    <Row>
                        <Col xs={3} md={2}>Ports:</Col>
                        <Col>
                            {container.ports.map(function(port) {
                                return port.PrivatePort;
                            })}
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={3} md={2}>Actions:</Col>
                        <Col>
                            {container.actions.map(function(action) {
                                return (
                                    <button key={action.name} type="button" onClick={Actions.container_action.bind(this, container, action.name)}>
                                        {action.label}
                                    </button>
                                );
                            })}
                        </Col>
                    </Row>
                </Grid>
            </Panel>
        );
    },
});

var Actions = {
    SERVER_UPDATE: 'docker-update',
    IMAGES_URL: '/api/docker/images', 
    CONTAINERS_URL: '/api/docker/containers',

    serverUpdate: function() {
        var images = [];
        var imagesPromise = $.get(this.IMAGES_URL);
        var containersPromise = $.get(this.CONTAINERS_URL);
        $.when(imagesPromise, containersPromise).done(function(imageResponse, containerResponse) {
            var images = imageResponse[0].results;
            var containers = containerResponse[0].results;
            dispatcher.dispatch({action: this.SERVER_UPDATE, images: images, containers: containers});
        }.bind(this));
    },

    image_action: function(image, action) {
        $.post('api/docker/images/' + image.image_id + '/' + action, function(response) {
            Actions.serverUpdate();
        }.bind(this));
    },

    saveConfig: function(arg) {
        console.log(arg);
        console.log('Saving config');
    },

    container_action: function(container, action) {
        $.post('api/docker/containers/' + container.container_id + '/' + action, function(response) {
            Actions.serverUpdate();
        }.bind(this));
    },
};

var DockerStore = assign({}, EventEmitter.prototype, {

    _images: [],
    _containers: [],

    getImages: function() {
        return this._images;
    },

    emitChange: function() {
        this.emit(this.CHANGE_EVENT);
    },

    addChangeListener: function(callback) {
        this.on(this.CHANGE_EVENT, callback);
    },

    removeChangeListener: function(callback) {
        this.removeListener(this.CHANGE_EVENT, callback);
    },

    dispatcherIndex: dispatcher.register(function(payload) {
        switch(payload.action) {
            case Actions.SERVER_UPDATE:
                DockerStore._images = payload.images;
                DockerStore._containers = payload.containers;
                // map containers to images
                var images_by_id = {};
                payload.images.forEach(function(image) {
                    images_by_id[image.image_id] = image;
                    image.containers = [];
                });
                payload.containers.forEach(function(container) {
                    images_by_id[container.image_id].containers.push(container);
                });
                DockerStore.emitChange();
                break;
        }

        return true;
    })
});

var TAB_CONFIG = 'config';
var TAB_DOCKER = 'docker';
var LightHouseStore = assign({}, EventEmitter.prototype, {

    _tab: TAB_CONFIG,

    CHANGE_EVENT: 'lighthouse-change',

    getTab: function() {
        return this._tab;
    },

    updateTab: function(tab) {
        this._tab = tab;
    },

    emitChange: function() {
        this.emit(this.CHANGE_EVENT);
    },

    addChangeListener: function(callback) {
        this.on(this.CHANGE_EVENT, callback);
    },

    removeChangeListener: function(callback) {
        this.removeListener(this.CHANGE_EVENT, callback);
    },

    dispatcherIndex: dispatcher.register(function(payload) {
        var action = payload.action;
        var text;

        switch(action) {
            case 'tab-selected':
                LightHouseStore.updateTab(payload.tab);
                LightHouseStore.emitChange();
                break;

        }

        return true;
    })
});

var Header = React.createClass({
    render: function() {
        return (
            <Grid bsStyle="info">
                <Row className="show-grid">
                    <Col xs={4} md={3}><img src="/static/images/lighthouse.png" /></Col>
                    <Col xs={5} md={4}><PageHeader>Lighthouse</PageHeader></Col>
                </Row>
            </Grid>
        );
    }
});

var NavBar = React.createClass({
    getInitialState: function() {
        return this._getState();
    },

    componentDidMount: function() {
        LightHouseStore.addChangeListener(this._onChange);
    },

    componentsWillUnmount: function() {
        LightHouseStore.removeChangeListener(this._onChange);
    },

    _onChange: function() {
        this.setState(this._getState());
    },
        
    _getState: function() {
        return {
            selectedTab: LightHouseStore.getTab()
        };
    },

    _onSelect: function(tab) {
        dispatcher.dispatch({source: 'VIEW_ACTION', action: 'tab-selected', tab: tab});
    },

    render: function() {
        return (
            <Nav bsStyle="tabs" activeKey={this.state.selectedTab} onSelect={this._onSelect}>
                <NavItem eventKey={TAB_CONFIG}>Config</NavItem>
                <NavItem eventKey={TAB_DOCKER}>Docker</NavItem>
            </Nav>
        );
    }
});

var MainPanel = React.createClass({

    getInitialState: function() {
        return this._getState();
    },

    componentDidMount: function() {
        Actions.serverUpdate();
        LightHouseStore.addChangeListener(this._onChange);
    },

    componentsWillUnmount: function() {
        LightHouseStore.removeChangeListener(this._onChange);
    },

    _onChange: function() {
        this.setState(this._getState());
    },

    _getState: function() {
        return {
            activeTab: LightHouseStore.getTab()
        };
    },

    render: function() {
        switch (this.state.activeTab) {
            case TAB_CONFIG:
                return (<div></div>);
            case TAB_DOCKER:
                return (<div><ImageList /></div>);
            default:
                return (<div></div>);
        }
    }

});

var LightHouse = React.createClass({

    componentDidMount: function() {
        Actions.serverUpdate();
    },

    render: function() {
        var style = {backgroundColor: 'light-blue'};
        return (
            <div style={style}>
                <Header />
                <ImageList />
            </div>
        );
    }
});

ReactDOM.render(
    <LightHouse />,
    document.getElementById('main')
);
