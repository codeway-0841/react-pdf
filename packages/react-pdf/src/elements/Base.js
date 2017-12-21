import Yoga from 'yoga-layout';
import toPairsIn from 'lodash.topairsin';
import isFunction from 'lodash.isfunction';
import upperFirst from 'lodash.upperfirst';
import StyleSheet from '../stylesheet';
import Borders from '../mixins/borders';

class Base {
  parent = null;
  children = [];

  static defaultProps = {
    style: {},
  };

  constructor(root, props) {
    this.root = root;

    this.props = {
      ...this.constructor.defaultProps,
      ...Base.defaultProps,
      ...props,
    };

    this.style = StyleSheet.resolve(this.props.style);
    this.layout = Yoga.Node.createDefault();
    this.currentSubPage = 0;

    if (this.props) {
      this.applyProps(this.props);
    }
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    this.layout.insertChild(child.layout, this.layout.getChildCount());
  }

  removeChild(child) {
    const index = this.children.indexOf(child);

    child.parent = null;
    this.children.splice(index, 1);
    this.layout.removeChild(child.layout);
  }

  applyProps(props) {
    if (this.style) {
      toPairsIn(this.style).map(([attribute, value]) => {
        this.applyStyle(attribute, value);
      });
    }
  }

  applyStyle(attribute, value) {
    const setter = `set${upperFirst(attribute)}`;

    switch (attribute) {
      case 'marginTop':
        this.layout.setMargin(Yoga.EDGE_TOP, value);
        break;
      case 'marginRight':
        this.layout.setMargin(Yoga.EDGE_RIGHT, value);
        break;
      case 'marginBottom':
        this.layout.setMargin(Yoga.EDGE_BOTTOM, value);
        break;
      case 'marginLeft':
        this.layout.setMargin(Yoga.EDGE_LEFT, value);
        break;
      case 'paddingTop':
        this.layout.setPadding(Yoga.EDGE_TOP, value);
        break;
      case 'paddingRight':
        this.layout.setPadding(Yoga.EDGE_RIGHT, value);
        break;
      case 'paddingBottom':
        this.layout.setPadding(Yoga.EDGE_BOTTOM, value);
        break;
      case 'paddingLeft':
        this.layout.setPadding(Yoga.EDGE_LEFT, value);
        break;
      case 'borderTopWidth':
        this.layout.setBorder(Yoga.EDGE_TOP, value);
        break;
      case 'borderRightWidth':
        this.layout.setBorder(Yoga.EDGE_RIGHT, value);
        break;
      case 'borderBottomWidth':
        this.layout.setBorder(Yoga.EDGE_BOTTOM, value);
        break;
      case 'borderLeftWidth':
        this.layout.setBorder(Yoga.EDGE_LEFT, value);
        break;
      case 'position':
        this.layout.setPositionType(
          value === 'absolute'
            ? Yoga.POSITION_TYPE_ABSOLUTE
            : Yoga.POSITION_TYPE_RELATIVE,
        );
        break;
      case 'top':
        this.setPosition(Yoga.EDGE_TOP, value);
        break;
      case 'right':
        this.setPosition(Yoga.EDGE_RIGHT, value);
        break;
      case 'bottom':
        this.setPosition(Yoga.EDGE_BOTTOM, value);
        break;
      case 'left':
        this.setPosition(Yoga.EDGE_LEFT, value);
        break;
      default:
        if (isFunction(this.layout[setter])) {
          this.layout[setter](value);
        }
    }
  }

  setPosition(edge, value) {
    const isPercent = /^(\d+)?%$/g.exec(value);

    if (isPercent) {
      this.layout.setPositionPercent(edge, parseInt(isPercent[1], 10));
    } else {
      this.layout.setPosition(edge, value);
    }
  }

  async recalculateLayout() {
    const childs = await Promise.all(
      this.children.map(child => child.recalculateLayout()),
    );
    return childs;
  }

  getAbsoluteLayout() {
    const myLayout = this.layout.getComputedLayout();

    const parentLayout = this.parent.getAbsoluteLayout
      ? this.parent.getAbsoluteLayout()
      : { left: 0, top: 0 };

    return {
      left: myLayout.left + parentLayout.left,
      top: myLayout.top + parentLayout.top,
      height: myLayout.height,
      width: myLayout.width,
    };
  }

  getComputedPadding() {
    return {
      top: this.layout.getComputedPadding(Yoga.EDGE_TOP),
      right: this.layout.getComputedPadding(Yoga.EDGE_RIGHT),
      bottom: this.layout.getComputedPadding(Yoga.EDGE_BOTTOM),
      left: this.layout.getComputedPadding(Yoga.EDGE_LEFT),
    };
  }

  getWidth() {
    return (
      this.layout.getComputedWidth() +
      this.layout.getComputedMargin(Yoga.EDGE_LEFT) +
      this.layout.getComputedMargin(Yoga.EDGE_RIGTH) -
      this.layout.getComputedPadding(Yoga.EDGE_LEFT) -
      this.layout.getComputedPadding(Yoga.EDGE_RIGTH)
    );
  }

  getHeight() {
    return (
      this.layout.getComputedHeight() +
      this.layout.getComputedMargin(Yoga.EDGE_TOP) +
      this.layout.getComputedMargin(Yoga.EDGE_BOTTOM) -
      this.layout.getComputedPadding(Yoga.EDGE_TOP) -
      this.layout.getComputedPadding(Yoga.EDGE_BOTTOM)
    );
  }

  drawBackgroundColor() {
    const { left, top, width, height } = this.getAbsoluteLayout();
    const { backgroundColor } = this.style;

    if (backgroundColor) {
      this.root
        .fillColor(backgroundColor)
        .rect(left, top, width, height)
        .fill();
    }
  }

  async renderWrapChildren(page) {
    const renderedChilds = [];
    let availableHeight = this.parent.getHeight();

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const childHeight = child.getHeight();

      if (availableHeight >= childHeight) {
        await child.render(page);
        renderedChilds.push(child);

        availableHeight -= childHeight;
      } else {
        page.addNewSubpage(++this.currentSubPage);
        break;
      }
    }

    // Remove childs
    renderedChilds.forEach(this.removeChild.bind(this));
  }

  async renderPlainChildren(page) {
    for (let i = 0; i < this.children.length; i++) {
      await this.children[i].render(page);
    }
  }

  async renderChildren(page) {
    if (page.props.wrap) {
      await this.renderWrapChildren(page);
    } else {
      await this.renderPlainChildren(page);
    }
  }
}

Object.assign(Base.prototype, Borders);

export default Base;
