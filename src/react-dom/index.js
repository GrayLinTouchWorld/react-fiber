let isFirstRender = false; //是否是初次渲染
const HostRoot = 'HostRoot'; //RootFiber类型
const ClassComponent = 'ClassComponent'; //类组件类型
const HostComponent = 'HostComponent'; //原生dom类型
const HostText = 'HostText' //文本类型

const NoWork = 'NoWork' ; //没有哦那中国
const Placement = 'Placement' //这个节点是新加入的
const Update = 'Update' //当前节点要更新
const Deletion = 'Deletion' //当前节点要被删除
const PlacementAndUpdate = 'PlacementAndUpdate' //当前节点换了位置并且要更新内容 

let isWorking = false //是否在工作
let isCommitting = false //是否在提交阶段

let nextUnitOfWork = null

let classComponentUpdater = {
  enqueueSetState(){

  }
}

//事件类型
let eventsName = {
  onClick: 'click',
  onChange: 'change',
  onInput: 'input',
  //...
}


class FiberNode{
  constructor(tag, pendingProps, key ){
    this.tag = tag //标识当前的fiber类型
    this.key = key
    this.type = null //fiber的标签，例如：'div','p'等
    this.stateNode = null //当前fiber实例对象
    this.child = null //当前fiber的子节点
    this.sibling = null //当前fiber下一个兄弟节点
    this.return  = null //当前fiber的父节点
    this.index = 0 //
    this.memoizedState = null //当前fiber的state
    this.memoizedProps = null //当前fiber的props
    this.pendingProps = pendingProps //新加入的props
    this.effectTag = NoWork //当前fiber准备进行何种更新
    this.firstEffect = null  //当前节点有更新的第一个子节点
    this.lastEffect = null //当前节点有更新的最后一个子节点
    this.nextEffect = null //下一个更新节点
    this.alternate = null //连接current和workInProgress
    this.updateQueue = null //当前fiber的新的状态，一般是setState的内容
   }
}

function createFiber(tag, pendingProps, key){
  return new FiberNode(tag, pendingProps, key)
}

function reconcileSingleElement(returnFiber, element){
  let type = element.type
  let flag = null
  if(element.$$typeof === Symbol.for('react.element')){
    if(typeof type === 'function'){
      //class节点
      if(type.prototype && type.prototype.isReactComponent) {
        flag = ClassComponent
      }
    }else if(typeof type === 'string'){
      //原生节点
      flag = HostComponent
    }

    let fiber = createFiber(flag, element.props, element.key)
    fiber.type = type
    fiber.return = returnFiber
    return fiber 

  }
}

function reconcileSingleTextNode(returnFiber, element){
  let fiber = createFiber(HostText, element, null)
  fiber.return = returnFiber
  return fiber
}

function reconcileChildrenArray(workInProgress, nextChildren){
  let nowWorkInProgress = null
  if(isFirstRender){
    nextChildren.forEach((reactElement, index) => {
      if(index === 0){
        if(typeof reactElement == 'string' || typeof reactElement == 'number'){
          workInProgress.child = reconcileSingleTextNode(workInProgress, reactElement)
        } else{
          workInProgress.child = reconcileSingleElement(workInProgress, reactElement)
        }
        nowWorkInProgress = workInProgress.child
      }else{
        if(typeof reactElement == 'string' || typeof reactElement == 'number'){
          nowWorkInProgress.sibling = reconcileSingleTextNode(workInProgress, reactElement)
        } else{
          nowWorkInProgress.sibling = reconcileSingleElement(workInProgress, reactElement)
        }
        nowWorkInProgress = nowWorkInProgress.sibling
      }
    })
    return workInProgress.child;
  }
}

function reconcileChildFiber(workInProgress, nextChildren){
  if(typeof nextChildren === 'object' && !!nextChildren && !!nextChildren.$$typeof){
    //单个节点
    return reconcileSingleElement(workInProgress, nextChildren)
  }
  if(nextChildren instanceof Array){
    return reconcileChildrenArray(workInProgress, nextChildren)
  }
  if(typeof nextChildren === 'string' || typeof nextChildren === 'number'){
    // return reconcileSingleTextNode(workInProgress, nextChildren)
  }
  return null;
}

function reconcileChildren(workInProgress, nextChildren){
  if(isFirstRender && !!workInProgress.alternate){
    //拿到子节点的fiber
    workInProgress.child = reconcileChildFiber(workInProgress, nextChildren)
    //初次渲染的时候要设置修改状态为插入
    workInProgress.child.effectTag = Placement
  }else{
    workInProgress.child = reconcileChildFiber(workInProgress, nextChildren)
  }
  return workInProgress.child
}

function updateHostRoot(workInProgress) {
  let children = workInProgress.memoizedState.element
  return reconcileChildren(workInProgress, children)
}

function updateClassComponent(workInProgress){
   let component = workInProgress.type
   let nextProps = workInProgress.pendingProps
   if(!!component.defaultProps){
     nextProps = Object.assign({}, component.defaultProps,nextProps)
   }

   let shouldUpdate = null
   let instance = workInProgress.stateNode
   if(!instance){
     //初次渲染，没有实例对象
     instance = new component(nextProps)
     workInProgress.memoizedState = instance.state
     workInProgress.stateNode = instance
     instance._reactInternalFiber = workInProgress
     instance.updater = classComponentUpdater
     
     //处理getDerivedStateFromProps生命周期钩子
     let getDerivedStateFromProps = component.getDerivedStateFromProps
     if(!!getDerivedStateFromProps){
       let newState = getDerivedStateFromProps(nextProps, workInProgress.memoizedState)
       if(!(newState === null || newState === undefined)){
         if(typeof newState === 'object' && !(newState instanceof Array)){
           workInProgress.memoizedState = Object.assign({}, nextProps, newState)
         }
         instance.state = workInProgress.memoizedState
       }  

       shouldUpdate = true
     }else{

     }  
     let nextChild = instance.render();
     return reconcileChildren(workInProgress, nextChild) 

   }
}

function updateHostComponent(workInProgress){
  let nextProps = workInProgress.pendingProps
  let nextChildren = nextProps.children

  //对于子节点是单独的文本节点，不用给他生成fiber
  if(typeof nextChildren === 'string' || typeof nextChildren === 'number'){
    nextChildren = null;
  }

  return reconcileChildren(workInProgress, nextChildren)
}

//创建子节点的fiber
function beginWork(workInProgress){

  let tag = workInProgress.tag;
  let next = null
  
  //判断当前节点的类型
  if(tag === HostRoot) {
    //根节点类型
    next = updateHostRoot(workInProgress)
  }else if(tag === ClassComponent) {
    //class节点类型
    next = updateClassComponent(workInProgress)
  }else if(tag === HostComponent) {
    //原生dom类型
    next = updateHostComponent(workInProgress)
  }else if(tag === HostText) {
    //文本类型，没有子节点，直接返回
    next = null;
  }

  return next;
}

function completeWork(workInProgress){
  let tag = workInProgress.tag
  let instance = workInProgress.stateNode
  if(tag === HostComponent){
    if(!instance){
      //初始的时候没有真实dom
      let domElement = document.createElement(workInProgress.type)
      domElement.__reactInternalInstance = workInProgress
      workInProgress.stateNode = domElement;
      //插入子节点
      let node = workInProgress.child
      wrapper:while(!!node){
        let tag = node.tag
        if(tag === HostComponent || tag === HostText){
          //如果是原生节点或者文本节点
          domElement.appendChild(node.stateNode)
        }else{
          //可能是我们自己写的类节点
          node.child.return = node
          node = node.child
          continue
        }

        if(node === workInProgress) break;

        while(node.sibling === null){
          if(node.return === null || node.return === workInProgress){
            break wrapper;
          }
          node = node.return 
        }
  
        node.sibling.return = node.return 
        node = node.sibling
      }

      //插入属性
      let props = workInProgress.pendingProps
      for(let propKey in props){
        let propsValue = props[propKey]
        if(propKey === 'children'){
          //单独的文本节点，我们没有生成fiber，直接插入
          if(typeof propsValue === 'string' || typeof propsValue === 'number'){
            domElement.textContent = propsValue
          }
        }else if(propKey === 'style'){
          for(let stylePropKey in propsValue){
            if(!propsValue.hasOwnProperty(stylePropKey)) continue
            let styleValue = propsValue[stylePropKey].trim()
            if(stylePropKey === 'float') {
              //float需要单独处理
              stylePropKey = 'cssFloat'
            }
            domElement.style[stylePropKey] = styleValue
          }
        }else if(eventsName.hasOwnProperty(propKey)){
          //处理事件绑定，
          //react将所有原生事件进行了重写，生成新的合成事件
          //react还会将事件监听绑定在根节点
          //react内部还有自己的组织冒泡和默认事件的方法
          let event = props[propKey]
          domElement.addEventListener(eventsName[propKey], event, false)
        }else{
          //还有其他处理，这里省略，直接设置成属性
          domElement.setAttribute(propKey, propsValue)
        }
      }
    }
  }else if(tag === HostText){
    let oldText = workInProgress.memoizedProps
    let newText = workInProgress.pendingProps
    if(!instance){
      //初次渲染
      instance = document.createTextNode(newText)
      workInProgress.stateNode = instance
    }else{

    }
  }
}

function completeUnitOfWork(workInProgress){
  while(true){
    let returnFiber = workInProgress.return 
    let sibling = workInProgress.sibling;

    completeWork(workInProgress)

    let effectTag = workInProgress.effectTag
    let hasChange = (
      effectTag === Update ||
      effectTag === Deletion ||
      effectTag === Placement ||
      effectTag === PlacementAndUpdate
    )

    if(hasChange){
      if(!!returnFiber.lastEffect){
        returnFiber.lastEffect.nextEffect = workInProgress
      }else{
        returnFiber.firstEffect = workInProgress
      }
      returnFiber.lastEffect = workInProgress 
    }

    if(!!sibling) return sibling //有兄弟节点就返回兄弟节点
    if(!!returnFiber){//没有兄弟节点就跳到父节点
      workInProgress = returnFiber
      continue
    }
    return null
  }
}


function performUnitOfWork(workInProgress){
  let next = beginWork(workInProgress) //跳到子节点
  if(next == null){
    //没有子节点 去看兄弟节点
    next = completeUnitOfWork(workInProgress)
    // debugger
  }
  return next
}

function workLoop(nextUnitOfWork){
  console.log(nextUnitOfWork);
  while(!!nextUnitOfWork){
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }
}

function commitRoot(root, finishedWork){
  isWorking = true
  isCommitting = true

  let nextEffect = null
  let firstEffect = finishedWork.firstEffect

  //挂载有三个循环
  //1. 处理生命周期getSnapshotBeforeUpdate
  //2. 处理更新，删除，插入等操作
  //3. 执行剩下的生命周期函数，componentDidMount

  // while (condition) {
    
  // }
  // debugger
  nextEffect = firstEffect
  while (!!nextEffect) {
    let effectTag = nextEffect.effectTag
    if(effectTag.includes(Placement)){
      //初始化插入

      //找到一个能插入的父节点
      let parentFiber = nextEffect.return 
      let parent = null //找到的结果
      while(!!parentFiber){
        let tag = parentFiber.tag
        if(tag === HostComponent || tag === HostRoot){
          break;
        }
      }

      if(parentFiber.tag === HostComponent){
        parent = parentFiber.stateNode
      }else if(parentFiber.tag === HostRoot){
        parent = parentFiber.stateNode.container
      }
      
      if(isFirstRender){
        let tag = nextEffect.tag
        if(tag === HostComponent || tag === HostText){
          parent.appendChild(nextEffect.stateNode)
        }else{
          let child = nextEffect
          while(true){
            let tag = child.tag
            if(tag === HostComponent || tag === HostText){
              break;
            }
            child = child.child
          }
          parent.appendChild(child.stateNode)
          break
        }
      }
    }else if(effectTag === Update){

    }else if(effectTag === Deletion){

    }else if(effectTag === PlacementAndUpdate){
      //修改位置并更改内容
    }
  }

  // while (condition) {
    
  // }


  
  isWorking = false
  isCommitting = false
}

function completeRoot(root, finishedWork){
  root.finishedWork = null //清空一下
  commitRoot(root, finishedWork)
}



function createWorkInProgress(current, pendingProps){
  let workInProgress = current.alternate
  if(!workInProgress){
    workInProgress = createFiber(current.tag, pendingProps, current.key)
    workInProgress.type = current.type
    workInProgress.stateNode = current.stateNode
    workInProgress.alternate = current
    current.alternate = workInProgress
  }else{
    workInProgress.pendingProps = pendingProps
    workInProgress.effectTag = NoWork
    workInProgress.firstEffect = null
    workInProgress.lastEffect = null
    workInProgress.nextEffect = null

  }

  //我们每次都将updateQueue放在fiber实例上
  //奇数次的时候获取到的alternate不是真正的fiber实例，所以就没有updateQueue，就取在current上的updateQueue
  //源码中没有以下判断，而是调用enqueueUpdate将alternate的updateQueue和fiber的updateQueue同步，同时还会将重复的setState合并
  if(!!workInProgress || !!workInProgress.updateQueue || !workInProgress.updateQueue.lastEffect){
    workInProgress.updateQueue = current.updateQueue
  }

  workInProgress.child = current.child
  workInProgress.memoizedState = current.memoizedState
  workInProgress.memoizedProps = current.memoizedProps
  workInProgress.sibling = current.sibling
  workInProgress.index = current.index
  return workInProgress
}

class ReactRoot {
  constructor(container){
    this._initernalRoot = this._createRoot(container)
  }

  _createRoot(container){
    //最初始的时候没有current
    //创建了一个空的fiber作为current
    let uninitialFiber = this._createUnitialFiber(HostRoot, null, null);

    let root = {
      container: container,
      current: uninitialFiber, //指向current
      finishedWork: null, //指向WorkInProgress
    }

    uninitialFiber.stateNode = root;

    return root;
  }

  _createUnitialFiber(tag, pendingProps, key){
    return createFiber(tag, pendingProps, key)
  }

  render(reactElement, callback){
    let root = this._initernalRoot

    let workInProgress = new createWorkInProgress(root.current, null)
  
    workInProgress.memoizedState = {element: reactElement}

    nextUnitOfWork = workInProgress
    //循环创建fiber tree
    workLoop(nextUnitOfWork)
    //拿到workInProgress，结束render阶段
    root.finishedWork = root.current.alternate
    // debugger
    //开始commit，挂载
    if(!!root.finishedWork){
      completeRoot(root, root.finishedWork)
    }
  }
}

const ReactDOM = {
  render(reactElement, container, callback){
    isFirstRender = true;
    let root = new ReactRoot(container)

    container._reactRootContainer = root;
    
    root.render(reactElement,callback)

    isFirstRender = false
  }
}

export default ReactDOM