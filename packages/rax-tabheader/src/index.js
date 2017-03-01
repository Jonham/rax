import {createElement, Component, findDOMNode} from 'rax';
import View from 'rax-view';
import Text from 'rax-text';
import Image from 'rax-image';
import ScrollView from 'rax-scrollview';
import TouchableHighlight from 'rax-touchable';
import BottomLine from './bottomLine';
import BackgroundBlock from './backgroundRun';
import {Col, Grid, MultiRow} from 'rax-grid';
import Animated from './animation';
import Dimensions from '@ali/universal-dimensions';
import NormalItem from './normalItem';
import IconItem from './iconItem';
import style from './style';

const isWeex = typeof callNative !== 'undefined';

// 默认高度
const DROPDOWN_ROW_HEIGHT = 80;
const SCROLLVIEW_REF = 'scrollview';
const MARKER_REF = 'marker';
let windowWidth = Dimensions.get('window').width;

class TabHeader extends Component {
  
  constructor(props) {
    super(props);
    // item 个数
    let itemNum = this.props.dataSource ? this.props.dataSource.length : 0;
    // 列数
    let cols = this.props.dropDownCols;
    // 高度计算
    this.dropDownHeight = Math.ceil(itemNum / cols) * DROPDOWN_ROW_HEIGHT;
    // 动画相关
    this.state = {
      weexGridTop: -1000,
      weexGridLeft: -1000,
      weexGridPosition: 'fixed',
      weexGridHeight: 0,
      selected: props.selected
    };
    this.oldHeight = 0;
    this.oldRotateValue = 0;
    this.gridOpen = false;
    
    this.renderItem = props.renderItem;
    this.renderSelect = props.renderSelect;
    this.onPress = props.onPress;
    this.onSelect = props.onSelect;
    this.onSelected = props.onSelected;
  }

  componentDidMount() {
    // 禁用点击高亮效果
    if (!isWeex && typeof document !== 'undefined') {
      if (!document.getElementById('rxtabheaderstyle')) {
        var node = document.createElement('style'),   
          str = 'html{-webkit-tap-highlight-color: rgba(0, 0, 0, 0);}';  
        node.innerHTML = str; 
        node.id = 'rxtabheaderstyle';
        document.getElementsByTagName('head')[0].appendChild(node); 
      }
    }
    if (this.props.selected) { // 初始化选中
      this.select(this.props.selected);
    }
    // 初始化的回调方法
    setTimeout(() => {
      this.onSelect && this.onSelect(this.props.selected);      
    }, 10);
    setTimeout(() => {
      this.onSelected && this.onSelected(this.props.selected);
    }, 300);
  }

  // 设置组件样式
  resetStyle() {
    // 基础样式  
    this.containerStyle = { 
      ...style.container,
      ...style.container,
      ...this.props.style
    };
    // 带图标的导航容器
    if (this.styleType == 'icon') {
      this.containerStyle = {
        ...this.containerStyle,
        ...style.iconContainer
      };
    }
    // 用户自定义皮肤
    if (this.props.containerStyle) {
      this.containerStyle = {
        ...this.containerStyle,
        ...this.props.containerStyle
      };
    }
    // 单个 item 样式
    this.itemStyle = {
      ...style.item
    };
    if (!this.scrollType) {
      this.itemStyle.width = 750 / this.data.length + 'rem';
    }
    // 用户自定义皮肤
    if (this.props.itemStyle) {
      this.itemStyle = {
        ...this.itemStyle,
        ...this.props.itemStyle
      };
    }
    this.itemSelectedStyle = this.props.itemSelectedStyle;
    this.runningBorderStyle = this.props.runningBorderStyle;
    this.runningBgStyle = this.props.runningBgStyle;
  }

  // 导航 tab 滚动到指定位置
  scrollTo = (options) => {
    // 兼容 weex 左侧空白问题
    let xNum = parseInt(options.x);
    if (isWeex && xNum <= 0) {
      options.x = 0;
    }
    if (this.refs[SCROLLVIEW_REF]) {
      this.refs[SCROLLVIEW_REF].scrollTo(options);
    }
  }

  // 根据选择索引之行传入的 onSelect
  select = (index, isPress) => {
    let animTime = 300;

    // 收起下拉
    // this.state.height.setValue(0);
    // this.state.rotateValue.setValue(0);

    this.oldHeight = 0;
    this.oldRotateValue = 0;

    if (this.animType != 'noanim') {
      // 底部浮动 borderBottom
      if (MARKER_REF && this.refs[MARKER_REF]) {
        this.refs[MARKER_REF].scrollTo({x: index * parseInt(this.itemStyle.width)});
      }
      // 横向滚动动画
      this.scrollTo({x: parseInt(this.itemStyle.width) * index - 300});
    } else {
      animTime = 10;
    }
    // 动画后延迟触发
    if (this.selected != index) {
      isPress && this.onPress && this.onPress(index);
      this.onSelect && this.onSelect(index);
      this.state.selected = index;
      this.setState(this.state);
      setTimeout(() => {
        this.onSelected && this.onSelected(index);
      }, animTime);
    }
  }

  changeGrid = () => {
    if (!this.gridOpen) {
      if (isWeex) { 
        this.openPop(); // TODO： WXEnvironment.platform=='android' 兼容安卓弹层问题，ios 待测试
      } else {
        this.openDrop();
      }
    } else {
      if (isWeex) { 
        this.closePop();
      } else {
        this.closeDrop();
      }
    }
    this.gridOpen = !this.gridOpen;
  }

  // 唤起弹层 (安卓下有下拉遮罩问题)
  openPop = () => {
    
    let dom = require('@weex-module/dom');
    dom.scrollToElement(findDOMNode(this.props.id), {offset: 0});

    const icon = findDOMNode(this.refs.icon); 
    Animated.rotate(icon, 180);
    let dropDownHeight = parseInt(this.dropDownHeight) / 750 * windowWidth;
    const dropMultiRow = findDOMNode(this.refs.dropMultiRow); 
    Animated.height(dropMultiRow, dropDownHeight);

    this.state.weexGridTop = 0;
    this.state.weexGridLeft = 0;
    this.state.weexGridPosition = 'fixed';
    this.state.weexGridHeight = 2000;
    this.setState(this.state);

  }

  // 关闭遮罩层
  closePop = () => {

    // 下拉高度收起
    // this.state.height.setValue(0); 

    const icon = findDOMNode(this.refs.icon); 
    Animated.rotate(icon, 360);
    const dropMultiRow = findDOMNode(this.refs.dropMultiRow); 
    Animated.height(dropMultiRow, 0);

    if (!this.closePopIndex) {
      this.closePopIndex = 1;
    }
    this.closePopIndex++;

    // 收起遮罩层
    this.state.weexGridTop = -1000 - this.closePopIndex; // 使用每次变化的值是防止安卓下不更新,
    this.state.weexGridLeft = -1000 - this.closePopIndex;
    this.state.weexGridPosition = 'relative';
    this.state.weexGridHeight = 0;
    this.setState(this.state);

  }

  // 唤起下拉
  openDrop = () => {
    let dropDownHeight = parseInt(this.dropDownHeight) / 750 * windowWidth;
    const icon = findDOMNode(this.refs.icon); 
    Animated.rotate(icon, 180);
    const dropMultiRow = findDOMNode(this.refs.dropMultiRow); 
    Animated.height(dropMultiRow, dropDownHeight);
  }


  // 关闭下拉
  closeDrop = () => {
    const icon = findDOMNode(this.refs.icon); 
    Animated.rotate(icon, 360);
    const dropMultiRow = findDOMNode(this.refs.dropMultiRow); 
    Animated.height(dropMultiRow, 0);
  }


  /**
   * 根据不同 type ，渲染不同的导航项
  */

  // 渲染用户自定义导航项
  handleRenderItem = (item, index) => {
    
    let itemClass = (this.selected == index && this.renderSelect) ? this.renderSelect(item, index) : this.renderItem(item, index);

    // 宽度设置
    let eachItemWidth = style.item.width || '';
    let itemStyle = style.item;
    if (typeof(this.props.itemWidth) == 'function') {
      eachItemWidth = this.props.itemWidth(item, index);
      itemStyle = {
        ...style.item,
        ...{
          width: this.props.itemWidth(item, index)
        }
      };
    }
    this.itemWidthArr.push(eachItemWidth);
    
    return (
      <View 
        style={itemStyle} 
        onClick={
          () => {
            this.select(index, true);
          }
        }>
        {itemClass}
      </View>
    );
  }

  // 渲染默认导航项 for MXUI
  handleRenderDefaultItem = (item, index, type) => { 

    let select = false;

    if (this.selected == index) {
      select = true;
    }

    // 文本 tab
    let NormalItemClass = <NormalItem 
      style={this.itemStyle} 
      select={select} 
      item={item}
      itemSelectedStyle={this.itemSelectedStyle}
      onPress={() => { 
        this.select(index, true);
      }} />;

    // icon + 文本 tab
    let IconItemClass = <IconItem 
      style={this.itemStyle} 
      select={select} 
      item={item}
      itemSelectedStyle={this.itemSelectedStyle}
      onPress={() => { 
        this.select(index, true);
      }} />;

    let itemClass = (this.styleType == 'icon') ? IconItemClass : NormalItemClass;

        


    if (index == 0) { 

      // 第一个 tab 中添加额外的滚动容器
      if (this.scrollType == 'scroll') {
        return <View style={this.itemStyle} >
          {itemClass}
        </View>;
      } else {
        return <Col style={this.itemStyle} >
          {itemClass}
        </Col>;
      }

    } else {
      
      if (this.scrollType == 'scroll') {
        return itemClass;
      } else {
        return <Col style={this.itemStyle} >
          {itemClass}
        </Col>;
      }

    }
  }

  gridItemSelect = (index) => {
    this.changeGrid();
    this.select(index, true);
  }

  // 渲染下拉选项中的每项内容
  renderGridItemFun = (item, index) => {

    if (item == 'noitem') {
      return <View style={style.dropBoxTtem} />;
    } else if (this.selected == index) {
      return <TouchableHighlight 
        onPress={() => {
          this.gridItemSelect(index);
        }} 
        style={style.dropBoxTtem}>
          <Text style={style.dropBoxSelectText} >{item}</Text>
      </TouchableHighlight>;
    } else {
      return <TouchableHighlight 
        onPress={() => {
          this.gridItemSelect(index);
        }} 
        style={style.dropBoxTtem}>
          <Text style={style.dropBoxText} >{item}</Text>
      </TouchableHighlight>;
    }
  }

  // 渲染下拉容器
  renderGridFun = (dropData) => {
    if (this.styleType == 'dropdown') {
      let weexGridStyle = {};
      let weexGridMaskerStyle = {};
      if (isWeex) {
        weexGridStyle.top = this.state.weexGridTop + 80;
        weexGridStyle.left = this.state.weexGridLeft;
        weexGridStyle.position = this.state.weexGridPosition;
        weexGridStyle.height = parseInt(this.dropDownHeight) / 750 * windowWidth;
        weexGridMaskerStyle.top = this.state.weexGridTop;
        weexGridMaskerStyle.left = this.state.weexGridLeft;
        weexGridMaskerStyle.position = this.state.weexGridPosition;
        weexGridMaskerStyle.height = this.state.weexGridHeight;
      }
      return <View ref="grid" style={style.drop}>
          <TouchableHighlight style={style.dropBtn} onPress={this.changeGrid}>
            <Image
              ref="icon"
              source={{uri: '//gw.alicdn.com/tps/TB1H03wKVXXXXX_aXXXXXXXXXXX-40-40.png'}}
              style={{
                width: '40rem',
                height: '40rem',
                position: 'absolute',
                top: '20rem',
                left: '15rem',
              }}
            />
          </TouchableHighlight>
          <TouchableHighlight 
            style={{
              backgroundColor: '#000000',
              opacity: 0.1,
              width: 750,
              zIndex: 100,
              ...weexGridMaskerStyle
            }} 
            onPress={this.changeGrid} />
          <View 
            ref="dropMultiRow"
            style={{
              backgroundColor: '#ffffff',
              position: 'absolute',
              top: 81,
              right: 0,
              width: 750,
              height: 0,
              paddingRight: 100,
              overflow: 'hidden',
              zIndex: 100,
              ...weexGridStyle
            }}>
            <MultiRow dataSource={dropData} rows={this.props.dropDownCols} renderRow={this.renderGridItemFun} />
          </View>
        </View>;
    } else {
      return <View />;
    }
  }

  renderRootBox = (childrens) => {

    let bottomLineClass = (this.animType == 'border') ? <BottomLine ref={MARKER_REF} selected={this.selected} itemWidth={this.itemStyle.width} style={this.runningBorderStyle} styleType={this.styleType} /> : null;
    let BackgroundBlockClass = (this.animType == 'bg') ? <BackgroundBlock ref={MARKER_REF} selected={this.selected} itemWidth={this.itemStyle.width} style={this.runningBgStyle} /> : null;


    // 修复低版本 ios 横向未撑开问题
    if (this.scrollType == 'scroll') {
      let contentContainerHeight = 0;
      if (childrens.length) {
        childrens.map(function(item) {
          let itemWidth = item.props.style.width;
          if (itemWidth) {
            contentContainerHeight += parseInt(itemWidth);
          }
        });
      } else {
        contentContainerHeight += parseInt(childrens.props.style.width);
      }

      return <ScrollView 
        ref={SCROLLVIEW_REF} 
        style={{
          ...this.containerStyle,
          display: 'block'
        }} 
        contentContainerStyle={{
          justifyContent: 'center',
          flexDirection: 'row',
          width: contentContainerHeight
        }}
        showsHorizontalScrollIndicator={false}
        horizontal={true}>
          {BackgroundBlockClass}
          {childrens}
          {bottomLineClass}
      </ScrollView>;
    } else {
      return <Grid style={this.containerStyle}>
            {BackgroundBlockClass}
            {childrens}
            {bottomLineClass}
        </Grid>;
    }

  }


  render() {
    
    this.itemWidthArr = [];
    
    // 设置默认导航类型
    let type = (this.props.type || 'default-noanim-scroll').toLowerCase();
    let typeArr = type.split('-');
    this.styleType = typeArr[0];
    this.animType = typeArr[1];
    this.scrollType = typeArr[2];

    this.data = this.props.data || this.props.dataSource;
    if (typeof(this.props.itemWidth) == 'string') { 
      style.item.width = this.props.itemWidth; 
    }
    this.selected = Number(this.state.selected) || 0;
    this.resetStyle();

    // 设置内部 item 元素
    let itemList;
    if (this.styleType == 'dropdown' || this.styleType == 'normal') {

      if (this.styleType == 'dropdown') {

        // 默认下拉数据填充
        let dropData = [];
        let nullNum = this.data.length % this.props.dropDownCols;
        if (nullNum) {
          nullNum = this.props.dropDownCols - nullNum;
        }
        for (let i = 0; i < (this.data.length + nullNum); i++) {
          if (i < this.data.length) {
            dropData.push(this.data[i]);
          } else {
            dropData.push('noitem');
          }
        }
        this.gridView = this.renderGridFun(dropData);
        // 用于下拉导航的切换
        this.containerStyle.width = (750 - 71) + 'rem';
      } else {
        this.containerStyle.width = '750rem';
      }

      itemList = this.data.map((item, index) => 
        this.handleRenderDefaultItem(item, index)
      );

    } else if (this.styleType == 'icon') {
      itemList = this.data.map((item, index) => 
        this.handleRenderDefaultItem(item, index)
      );
    } else {
      itemList = this.data.map((item, index) => 
        this.handleRenderItem(item, index)
      );
    }

    return <View id={this.props.id} ref={'tabheader'}>
        {this.gridView}
        {this.renderRootBox(itemList)}
      </View>;
  }
}

TabHeader.defaultProps = {
  selected: 0,
  id: 'tabHeader'
};

export default TabHeader;