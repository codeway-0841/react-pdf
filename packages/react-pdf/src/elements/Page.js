import SubPage from './SubPage';

class Page {
  parent = null;
  children = [];

  static defaultProps = {
    size: 'A4',
    orientation: 'portrait',
    style: {},
    wrap: false,
  };

  constructor(root, props) {
    this.root = root;
    this.props = { ...Page.defaultProps, ...props };
    this.subpages = [];
    this.currentSubPage = 0;

    this.addInitialSubpage();
  }

  addInitialSubpage() {
    const newSubpage = new SubPage(this.root, this.props);

    newSubpage.parent = this;

    this.subpages.push(newSubpage);
  }

  addNewSubpage(index) {
    if (this.subpages.length < index) {
      const originalSubpage = this.subpages[0];
      const newSubpage = new SubPage(this.root, this.props);

      newSubpage.parent = this;
      newSubpage.layout = originalSubpage.layout;
      newSubpage.children = originalSubpage.children;

      this.subpages.push(newSubpage);
    }
  }

  appendChild(child) {
    this.subpages[0].appendChild(child);
  }

  removeChild(child) {
    this.subpages[0].removeChild(child);
  }

  getWidth() {
    return this.subpages[0].getWidth();
  }

  getHeight() {
    return this.subpages[0].getHeight();
  }

  async render() {
    for (let i = 0; i < this.subpages.length; i++) {
      await this.subpages[i].render(this);
    }
  }
}

export default Page;
