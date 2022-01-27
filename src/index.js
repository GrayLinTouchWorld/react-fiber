import React from './react'
import ReactDOM from './react-dom'

class Ding2 extends React.Component{
  render(){
    return (
      <div>ding2</div>
    )
  }
}


class Ding extends React.Component {
  state = {
    ding:999
  }

  handleClick = () => {
    this.setState({
      ding:666
    })
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <h1 style={{color:'#11'}}>abc</h1>
        <h2>
          123
          <p>456</p>
        </h2>
        <h3>
          <span>
            <Ding2></Ding2>
          </span>
        </h3>
      </div>
    )
  }
}


ReactDOM.render(
  <Ding prop1={666} key='789' />,
  document.querySelector('#app') 
)

//编译后的代码
// React.createElement(
//   "div", 
//   {
//     onClick: (void 0).handleClick
//   }, 
//   React.createElement(
//     "h1", 
//     {
//       color: "#11"
//     }, "abc"
//   ), 
//   React.createElement("h2", null, "123", 
//   React.createElement("p", null, "456")), 
//   React.createElement("h3", null, 
//     React.createElement("span", null, "123")
//   )
// );