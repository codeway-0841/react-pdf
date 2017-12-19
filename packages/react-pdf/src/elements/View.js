import Base from './Base';

class View extends Base {
  static defaultProps = {
    style: {},
  };

  async render(page) {
    this.drawBackgroundColor();
    this.drawBorders();

    await this.renderChildren(page);
  }
}

export default View;
