"use strict";

var emitter = require("./emitter");
var dispatcher = require("./dispatcher");

var ImageAction = React.createClass({

    propTypes: {
        image: React.PropTypes.object.isRequired
    },

    takeAction: function() {
        var url = '/api/docker/images/' + this.props.action.name + '/' + this.props.image.image_id;
        console.log(url);
        $.post(url, function(items) {
            console.log('action: ' + this.props.action.name + ' on ' + this.props.image.image_id);
            dispatcher.dispatch({ type: 'containers-fetch' });
            dispatcher.dispatch({ type: 'images-fetch' });
        }.bind(this));
    },

    render: function() {
        return (<button type="button" onClick={this.takeAction}>{this.props.action.label}</button>);
    }

});

var ContainerAction = React.createClass({

    propTypes: {
        container: React.PropTypes.object.isRequired
    },

    takeAction: function() {
        var url = '/api/docker/containers/' + this.props.action.name + '/' + this.props.container.container_id;
        console.log(url);
        $.post(url, function(items) {
            console.log('action: ' + this.props.action.name + ' on ' + this.props.container.container_id);
            dispatcher.dispatch({ type: 'containers-fetch' });
        }.bind(this));
    },

    render: function() {
        return (<button type="button" onClick={this.takeAction}>{this.props.action.label}</button>);
    }

});

var Image = React.createClass({

    propTypes: {
        image: React.PropTypes.object.isRequired
    },

    styles: {
        container: {
            width: '700px',
            height: '100px',
            borderRadius: '25px',
            background: '#73AD21',
            margin: '10px auto' ,
            verticalAlign: 'top',
            textAlign: 'left'
        },
        left: {
            display: 'inline-block',
            width: '120px',
            textAlign: 'center',
            verticalAlign: 'top'
        },
        middle: {
            display: 'inline-block',
            width: '150px',
            textAlign: 'left',
            verticalAlign: 'top',
            margin: '10 auto'
        },
        right: {
            display: 'inline-block',
            width: '330px',
            textAlign: 'center',
            verticalAlign: 'middle',
            margin: '10 auto'
        },
        actions: {
            display: 'inline-block',
            width: '100px',
            textAlign: 'right',
            verticalAlign: 'middle',
            margin: '10 auto'
        },
        list: {
            listStyleType: 'none',
            margin: '0',
            padding: '0'
        },
        image: {
            width: '60px',
            height: '40px',
            backgroundImage: 'url(https://camo.githubusercontent.com/1e11d429705bf6695b79d24966cb1267c00b7df6/68747470733a2f2f7777772e646f636b65722e636f6d2f73697465732f64656661756c742f66696c65732f6f79737465722d72656769737472792d332e706e67)',
            backgroundSize: '60px 40px',
            margin: '10 auto',
        },
        text: {
            width: '80px',
        },
        contents: {
            verticalAlign: 'middle',
            textAlign: 'center',
            margin: '0 auto',
            padding: '3px'
        },
    },

    renderRepo: function(repo) {
        return (<li key={repo} style={this.styles.list}>{repo}</li>);
    },

    renderRepos: function(repositories) {
        var entries = [];
        for (var repo in repositories) {
            repositories[repo].forEach(function(tag) {
                entries.push(repo + ':' + tag)
            });
        }
        return (
            <ul style={this.styles.list}>{entries.map(this.renderRepo)}</ul>
        );
    },

    render: function() {
        var image = this.props.image;
        return (
            <div style={this.styles.container}>
                <div style={this.styles.left}>
                    <div style={this.styles.image}></div>
                    <div><span><input style={this.styles.text} type='text' readOnly='true' value={image.image_id} /></span></div>
                </div>
                <div style={this.styles.middle}>
                    <span>REPOSITORIES</span>
                    {this.renderRepos(image.repositories)}
                </div>
                <div style={this.styles.right}>
                    <div style={this.styles.contents}><div>Created</div><div>{image.created_at}</div></div>
                    <div style={this.styles.contents}><div>Virtual Size</div><div>{image.virtual_size}</div></div>
                </div>
                <div style={this.styles.actions}>
                    {image.actions.map(function(action) {
                        return (<ImageAction key={action.name} image={image} action={action} />);
                    })}
                </div>
            </div>
        );
    },
});

var ImageList = React.createClass({
    getInitialState: function() {
        return {
            images: []
        };
    },

    componentWillMount: function() {
        emitter.on('images-store-changed', function(response) {
            this.setState({ images: response.results });
        }.bind(this));
    },

    componentDidMount: function() {
        dispatcher.dispatch({ type: 'images-fetch' });
    },

    componentsWillUnmount: function() {
        emitter.off('images-store-changed');
    },

    create: function() {
        this.refs.create.show();
    },

    styles: {
        header: {
            textAlign: 'center'
        }
    },

    render: function() {
        return (
            <div style={this.styles.header}>
                <h3>IMAGES</h3>
                {this.state.images.map(function(image) {
                    return <Image key={image.image_id} image={image} />;
                })}
            </div>
        )
    }
});

var Container = React.createClass({

    propTypes: {
        container: React.PropTypes.object.isRequired
    },

    styles: {
        container: {
            width: '700px',
            height: '100px',
            borderRadius: '25px',
            background: '#73AD21',
            margin: '10px auto' ,
            verticalAlign: 'top',
            textAlign: 'left'
        },
        left: {
            display: 'inline-block',
            width: '120px',
            textAlign: 'center',
            verticalAlign: 'top',
            overflow: 'hidden',
            maxHeight: '100px'
        },
        middle: {
            display: 'inline-block',
            width: '150px',
            textAlign: 'left',
            verticalAlign: 'top',
            margin: '0 auto',
            overflow: 'hidden',
            maxHeight: '100px'
        },
        right: {
            display: 'inline-block',
            width: '330px',
            textAlign: 'center',
            verticalAlign: 'middle',
            margin: '0 auto',
            overflow: 'hidden',
            maxHeight: '100px'
        },
        actions: {
            display: 'inline-block',
            width: '100px',
            textAlign: 'right',
            verticalAlign: 'middle',
            margin: '0 auto',
            overflow: 'hidden',
            maxHeight: '100px'
        },
        list: {
            listStyleType: 'none',
            margin: '0',
            padding: '0'
        },
        image: {
            width: '60px',
            height: '40px',
            backgroundImage: 'url(http://pbs.twimg.com/profile_images/378800000124779041/fbbb494a7eef5f9278c6967b6072ca3e.png)',
            backgroundSize: '60px 40px',
            margin: '10 auto',
        },
        text: {
            width: '80px',
        },
        contents: {
            verticalAlign: 'middle',
            textAlign: 'center',
            margin: '0 auto',
            padding: '3px',
            overflow: 'hidden',
        },
    },

    render: function() {
        var container = this.props.container;
        return (
            <div style={this.styles.container}>
                <div style={this.styles.left}>
                    <div style={this.styles.image}></div>
                    <div><span><input style={this.styles.text} type='text' readOnly='true' value={container.container_id} /></span></div>
                </div>
                <div style={this.styles.middle}>
                    <div style={this.styles.contents}><div>Image</div><div>{container.image}</div></div>
                    <div style={this.styles.contents}><div>Command</div><div>{container.command}</div></div>
                </div>
                <div style={this.styles.right}>
                    <div style={this.styles.contents}><div>Created</div><div>{container.created_at}</div></div>
                    <div style={this.styles.contents}><div>Status</div><div>{container.status}</div></div>
                </div>
                <div style={this.styles.actions}>
                    {container.actions.map(function(action) {
                        return (<ContainerAction key={action.name} container={container} action={action} />);
                    })}
                </div>
            </div>
        );
    },
});

var ContainerList = React.createClass({
    getInitialState: function() {
        return {
            containers: []
        };
    },

    componentWillMount: function() {
        emitter.on('containers-store-changed', function(response) {
            this.setState({ containers: response.results });
        }.bind(this));
    },

    componentDidMount: function() {
        dispatcher.dispatch({ type: 'containers-fetch' });
    },

    componentsWillUnmount: function() {
        emitter.off('containers-store-changed');
    },

    create: function() {
        this.refs.create.show();
    },

    styles: {
        header: {
            textAlign: 'center'
        }
    },

    render: function() {
        return (
            <div style={this.styles.header}>
                <h3>CONTAINERS</h3>
                {this.state.containers.map(function(container) {
                    return <Container key={container.container_id} container={container} />;
                })}
            </div>
        )
    }

});

var Store = function(label) {
    dispatcher.register(function(payload) {
        switch (payload.type) {
            case label + '-fetch':
                this._all();
                break;
        }
    }.bind(this));
    
    this._all = function() {
        $.get("/api/docker/" + label, function(items) {
            this._notify(items);
        }.bind(this));
    }
    
    this._notify = function(items) {
        emitter.emit(label + '-store-changed', items);
    }
};

var ImageStore = new Store('images');
var ContainerStore = new Store('containers');

var headers = ['REPOSITORIES', 'CREATED', 'IMAGE ID', 'VIRTUAL SIZE'];
var imageTable = {
    repositories: ''
};

React.render(
    <ImageList />,
    document.getElementById('images')
);

React.render(
    <ContainerList />,
    document.getElementById('containers')
);
