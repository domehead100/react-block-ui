import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DefaultLoader from './Loader';
import safeActiveElement from './safeActiveElement';

const defaultProps = {
  tag: 'div',
  renderChildren: true,
  loader: DefaultLoader,
};

class BlockUi extends Component {
  constructor(props) {
    super(props);

    this.tabbedUpTop = this.tabbedUpTop.bind(this);
    this.tabbedDownTop = this.tabbedDownTop.bind(this);
    this.tabbedUpBottom = this.tabbedUpBottom.bind(this);
    this.tabbedDownBottom = this.tabbedDownBottom.bind(this);
    this.setHelper = this.setRef.bind(this, 'helper');
    this.setBlocker = this.setRef.bind(this, 'blocker');
    this.setTopFocus = this.setRef.bind(this, 'topFocus');
    this.setContainer = this.setRef.bind(this, 'container');
    this.setMessageContainer = this.setRef.bind(this, 'messageContainer');
    this.handleScroll = this.handleScroll.bind(this);

    this.state = { top: '50%' };
  }


  componentDidUpdate(prevProps) {
    if (prevProps.blocking !== this.props.blocking) {
      if (props.blocking) {
        // blocking started
        if (this.helper && this.helper.parentNode && this.helper.parentNode.contains
          && this.helper.parentNode.contains(safeActiveElement())) {
          this.focused = safeActiveElement();
          // https://www.tjvantoll.com/2013/08/30/bugs-with-document-activeelement-in-internet-explorer/#blurring-the-body-switches-windows-in-ie9-and-ie10
          if (this.focused && this.focused !== document.body) {
            (window.setImmediate || setTimeout)(() => this.focused && typeof this.focused.blur === 'function' && this.focused.blur());
          }
        }
      } else {
        this.detachListeners();
        const ae = safeActiveElement();
        if (this.focused && (!ae || ae === document.body || ae === this.topFocus)) {
          if (typeof this.focused.focus === 'function') {
            this.focused.focus();
          }
          this.focused = null;
        }
      }
    }
    if (prevProps.keepInView && (prevProps.keepInView !== this.props.keepInView || (prevProps.blocking && prevProps.blocking !== this.props.blocking))) {
      this.attachListeners();
      this.keepInView(prevProps);
    }
  }

  componentWillUnmount() {
    this.detachListeners();
  }

  setRef(name, ref) {
    this[name] = ref;
  }

  attachListeners() {
    window.addEventListener('scroll', this.handleScroll);
  }

  detachListeners() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  blockingTab(e, withShift = false) {
    // eslint-disable-next-line eqeqeq
    return this.props.blocking && (e.key === 'Tab' || e.keyCode === 9) && e.shiftKey == withShift;
  }

  tabbedUpTop(e) {
    if (this.blockingTab(e)) {
      this.blocker.focus();
    }
  }

  tabbedDownTop(e) {
    if (this.blockingTab(e)) {
      e.preventDefault();
      this.blocker.focus();
    }
  }

  tabbedUpBottom(e) {
    if (this.blockingTab(e, true)) {
      this.topFocus.focus();
    }
  }

  tabbedDownBottom(e) {
    if (this.blockingTab(e, true)) {
      e.preventDefault();
      this.topFocus.focus();
    }
  }

  keepInView(props = this.props) {
    if (props.blocking && props.keepInView && this.container) {
      const containerBounds = this.container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (containerBounds.top > windowHeight || containerBounds.bottom < 0) return;
      if (containerBounds.top >= 0 && containerBounds.bottom <= windowHeight) {
        if (this.state.top !== '50%') {
          this.setState({ top: '50%' });
        }
        return;
      }

      const messageBoundsHeight = this.messageContainer ? this.messageContainer.getBoundingClientRect().height : 0;
      let top = Math.max(Math.min(windowHeight, containerBounds.bottom) - Math.max(containerBounds.top, 0), messageBoundsHeight) / 2;
      if (containerBounds.top < 0) {
        top = Math.min(top - containerBounds.top, containerBounds.height - (messageBoundsHeight / 2));
      }
      if (this.state.top !== top) {
        this.setState({top});
      }

    }
  }

  handleScroll() {
    this.keepInView();
  }

  render() {
    const {
      tag: Tag,
      blocking,
      className,
      children,
      message,
      loader: Loader,
      renderChildren,
      keepInView,
      ...attributes
    } = this.props;

    const classes = blocking ? `block-ui ${className}` : className;
    const renderChilds = !blocking || renderChildren;

    return (
      <Tag {...attributes} className={classes} aria-busy={blocking}>
        {blocking &&
        <div tabIndex="0" onKeyUp={this.tabbedUpTop} onKeyDown={this.tabbedDownTop} ref={this.setTopFocus} />}
        {renderChilds && children}
        {blocking &&
        <div className="block-ui-container"
          tabIndex="0"
          ref={this.setBlocker}
          onKeyUp={this.tabbedUpBottom}
          onKeyDown={this.tabbedDownBottom}
        >
          <div className="block-ui-overlay" ref={this.setContainer} />
          <div className="block-ui-message-container"
            ref={this.setMessageContainer}
            style={{ top: keepInView ? this.state.top : undefined }}
          >
            <div className="block-ui-message">
              {message}
              {React.isValidElement(Loader) ? Loader : <Loader />}
            </div>
          </div>
        </div>
        }
        <span ref={this.setHelper} />
      </Tag>
    );
  }
}

BlockUi.propTypes = {
  blocking: PropTypes.bool,
  children: PropTypes.node,
  renderChildren: PropTypes.bool,
  keepInView: PropTypes.bool,
  className: PropTypes.string,
  message: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]),
  loader: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.node,
  ]),
  tag: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.shape({ $$typeof: PropTypes.symbol, render: PropTypes.func }),
  ]),
};
BlockUi.defaultProps = defaultProps;

export default BlockUi;
