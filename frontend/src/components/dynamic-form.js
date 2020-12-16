import React from 'react'
import ReactDOM from 'react-dom'
import Axios from 'axios'
import {userContext} from '../contexts/userContext'
import getUser from '../contexts/auth'
import Heading from '../components/post-heading'
import Image from '../components/post-image'
import Text from '../components/post-text'
import {validateByline, validateDescription, validateImage, validateTags, validateTitle} from '../components/validation'

/**@class - DynamicForm
 **@description- dynamic form that updates via JS
 * @since - 1.0.0
 * @style - 
 * */
export default class DynamicForm extends React.Component
{
    constructor(props){
        super(props)
        this.state={
            post:{
                title:"", description:"", byline:"", tags:"", data:[]
            },
            message:null,
            errors:[]
        }
        getUser()
    }
    convertToHTMLDate(date, infix){
        let day = date.getDate().toString()
        let month = date.getMonth() +1
        month = month.toString()
        let year = date.getFullYear().toString()
        if(month.length < 2){
            month = "0" + month
        }
        return year + infix + month + infix + day

    }
    mongoToHTMLDate=(date)=>{
        try{ return date.toString().substring(0, 10)}
        catch{return date}
    }
    componentWillMount(){
        getUser()
        if(this.props.handler == "update"){
            let link = window.location.pathname.split("/")[2]
            Axios.get("http://localhost:8080/posts/" + link)
            .then((response)=>{
                console.log(response.data)
                this.setState({
                    id:response.data.post._id,
                    post:response.data.post,
                    message:response.data.message
                })
                this.setState({
                    state:this.state,
                    post:{
                        title:response.data.post.title,
                        description:response.data.post.description,
                        byline:response.data.post.byline,
                        private:response.data.post.private,
                        data:[],
                        tags:response.data.post.tags,
                        date:response.data.post.date
                    }
                })
            })
            .catch(error=>console.error(error))
        }
       
    }
    uploadImage=(image_data)=>{
        console.log(image_data.name)
        const image = new FormData()
        image.append("image", image_data, image_data.name)
        Axios.post('http://localhost:8080/file/uploadimage', image)
        .then(response=>console.log(response.data))
    }
    
    getUserInputs=()=>{
        
        let elements = document.getElementsByClassName("form-input")
        let data_array = []
        for(let element of elements){
            if(element.getAttribute("name") == "image"){
                if(validateImage(element.files[0]?.name ?? "") == ""){

                    this.uploadImage(element.files[0])
                    data_array.push({
                        name:element.getAttribute("name"),
                        data:element.value
                    })
                }
                else{
                    this.state.errors.push("Unable to validate image - please ensure it is of type jpg, png, or jpeg")
                    this.setState({errors:this.state.errors, message:"Errors"})
                }     
            }
            else{
                data_array.push({
                    name:element.getAttribute("name"),
                    data:element.value
                })
            }
                       
        }
        return data_array        
    }
    updatePost=()=>{
        let tags_array = document.getElementById("tags").value.split(",")
        let data_array = this.getUserInputs()
        if(this.state.errors.length > 0){
            this.setState({message:"Errors"})
        }
        else{
            console.log(data_array)
            Axios.put('http://localhost:8080/posts/update', {
                id:this.state.id,
                title:this.state.post.title,
                date:this.state.post.date,
                description:this.state.post.description,
                byline:this.state.post.byline, 
                data:data_array,
                tags:tags_array,
                private: document.getElementById("private").checked ? true : false,
            })
            .then((res)=>this.setState({message:res.data.message}))
        }
        
    }
    addPost=()=>{
        let tags_array = document.getElementById("tags").value.split()
        let data_array = this.getUserInputs()
        Axios.post('http://localhost:8080/posts/new', {
            id:this.state.id,
            title:this.state.post.title,
            date:this.state.post.date,
            description:this.state.post.description,
            byline:this.state.post.byline, 
            data:data_array,
            tags:tags_array,
            private: document.getElementById("private").checked ? true : false,
            user_id:userContext.user.id
        })
        .then((res)=>{
                
            this.setState({post:[],message:res.data.message})
        })
    }
    validatePost=()=>{
        let valid_title = validateTitle(this.state.post.title)
        let valid_description = validateDescription(this.state.post.description)
        let valid_byline = validateByline(this.state.post.byline)
        let valid_date = this.state.post.date != null ? "" : "Date - ensure that it has a valid value"
        let valid_tags = ""
        if(valid_title == "" 
        && valid_description == "" 
        && valid_byline == "" 
        && valid_date == ""
        && valid_tags == ""){
            if(this.props.handler == "update"){
                this.updatePost()
            }
            else if(this.props.handler == "add"){
                this.addPost()
            } 
        }
        else{
            let errors = [valid_title, valid_description, valid_byline, valid_tags, valid_date]
            errors.forEach((e)=>{
                if(e != ""){
                    this.state.errors.push(e)
                }
            })
            if(this.state.errors.length > 0){
                this.setState({
                    message:"Errors",
                    errors:this.state.errors
                })
            }
            
        }
    }
    handleSubmit=()=>{
        
        this.setState({
            errors:[],
            message:""
        })
        this.validatePost()
        
        
    }
    
    handleClick=(text)=>{
        const newNode = document.createElement("div")
        const refElement = document.getElementById("form-picker")
        const headElement = document.getElementById("form-inputs")
        if(text == "heading"){
            headElement.insertBefore(newNode, refElement)
            ReactDOM.render(<Heading/>, newNode)
        }
        else if(text == "image"){
            headElement.insertBefore(newNode, refElement)
            ReactDOM.render(<Image/>, newNode)
        }
        else if(text == "text"){
            headElement.insertBefore(newNode, refElement)
            ReactDOM.render(<Text/>, newNode)
        }
    }

    handleInputChange=()=>{
        this.setState({
                state:this.state,
                post:{
                    id:this.state.id,
                    title:document.getElementById("title").value || this.state.post.title ,
                    date:document.getElementById("date").value,
                    data: [],
                    description:document.getElementById("description").value || this.state.post.description,
                    byline:document.getElementById("byline").value || this.state.post.byline, 
                    private:document.getElementById("private").value || this.state.post.private,
                    tags:document.getElementById("tags").value               
                }
            })
    }
    renderUpdate(){
        return(<div className="dynamic-form">
                <p>{this.state.message}</p>
                {
                    this.state.errors && this.state.errors.map((error)=>{
                        return(<text>{error}</text>)
                    })
                }
                <h1>Update a post</h1>
                
                <div id="form-inputs">
                    <div className="s-required">
                        <div>
                            <label for="title">Title:</label>
                            <input className="form-input-required" id="title" type="text" value={this.state.post.title} onChange={(e)=>{this.handleInputChange()}} name="title"/>
                        </div>
                        <div className="">
                        <label for="date">Date:</label>
                            <input className="form-input-required" id="date" type="date" value={this.mongoToHTMLDate(this.state.post.date)} onChange={(e)=>{this.handleInputChange()}}/>
                        </div>
                        <div>
                            <label for="byline">Byline:</label>
                            <input className="form-input-required" id="byline" type="text" value={this.state.post.byline} onChange={(e)=>{this.handleInputChange()}} name="byline"/>
                        </div>
                        <div>
                            <label for="description">Description:</label>
                            <input className="form-input-required" id="description" type="text" value={this.state.post.description} onChange={(e)=>{this.handleInputChange()}} name="description"/>
                        </div>
                        <div >
                        <label for="tags">Tags:</label>
                            <input className="form-input-required" id="tags" type="text"  value={this.state.post.tags} onChange={(e)=>{this.handleInputChange()}} name="tags"/>
                        </div>
                        <div>
                    <label for="private">Private:</label>
                        <input className="form-input-required" id="private" type="checkbox" name="private" value={this.state.post.private} onChange={(e)=>{this.handleInputChange()}}/>
                    </div>
                    </div>
                    {  
                       this.state.post.data && this.state.post.data.map((item)=>{
                        const newNode = document.createElement("div")
                        const refElement = document.getElementById("form-picker")
                        const headElement = document.getElementById("form-inputs")
                        if(item.name == "heading"){
                            headElement.insertBefore(newNode, refElement)
                            ReactDOM.render(<Heading value={item.data}/>, newNode)
                        }
                        else if(item.name == "image"){
                            console.log("hi")
                            headElement.insertBefore(newNode, refElement)
                            ReactDOM.render(<Image value={item.data}/>, newNode)
                        }
                        else if(item.name == "text"){
                            headElement.insertBefore(newNode, refElement)
                            ReactDOM.render(<Text value={item.data}/>, newNode)
                        }
                       })
                      
                   }
                    <div id="form-picker">
                        <div className="form-picker-img" onClick={(e)=>this.handleClick("image")}>
                            <i className="fa fa-image"/>
                            <p>Add an image</p>
                        </div>
                       
                        <div className="form-picker-img" onClick={(e)=>this.handleClick("text")}>
                            <i className="fa fa-image"/>
                            <p>Add text</p>
                        </div>
                        <div className="form-picker-img" onClick={(e)=>this.handleClick("heading")}>
                            <i className="fa fa-image"/>
                            <p>Add a heading</p>
                        </div>
                    </div>
                </div>
                <button type="button" onClick={(e)=>this.handleSubmit()}>Submit</button>
            </div>)
           

    }
    renderAdd(){
        return(
            <div className="dynamic-form">
                <p>{this.state.message}</p>
                {
                    this.state.errors && this.state.errors.map((error)=>{
                        return(<text>{error}</text>)
                    })
                }
                <h1>Add a post</h1>
                
                <div id="form-inputs">
                    <div className="form-inputs-required">
                        <div>
                            <label for="title">Title:</label>
                            <input className="form-input-required" required id="title" type="text" name="title" onChange={(e)=>{this.handleInputChange()}}/>
                        </div>
                        <div className="re">
                        <label for="date">Date:</label>
                            <input className="form-input-required"  required value={this.state.date} onChange={(e)=>{this.handleInputChange()}} id="date" type="date" name="date"/>
                        </div>
                        <div>
                            <label for="byline">Byline:</label>
                            <input className="form-input-required" id="byline" required type="text" value={userContext.user?.name} name="byline" onChange={(e)=>{this.handleInputChange()}}/>
                        </div>
                        <div>
                            <label for="description">Description:</label>
                            <input className="form-input-required" id="description" required type="text" name="description" onChange={(e)=>{this.handleInputChange()}}/>
                        </div>
                        <div>
                        <label for="tags">Tags:</label>
                            <input className="form-input-required" id="tags" required type="text" name="tags" onChange={(e)=>{this.handleInputChange()}}/>
                        </div>
                        <div>
                        <label for="private">Private:</label>
                        <input className="form-input-required" id="private" type="checkbox" name="private" onChange={(e)=>{this.handleInputChange()}}/>
                        </div>
                    </div>
                    <div id="form-picker">
                        <div className="form-picker-img" onClick={(e)=>this.handleClick("image")}>
                            <i className="fa fa-image"/>
                            <p>Add an image</p>
                        </div>
                       
                        <div className="form-picker-text" onClick={(e)=>this.handleClick("text")}>
                            <i className="fa fa-image"/>
                            <p>Add text</p>
                        </div>
                        <div className="form-picker-heading" onClick={(e)=>this.handleClick("heading")}>
                            <i className="fa fa-image"/>
                            <p>Add a heading</p>
                        </div>
                    </div>
                </div>
                <button type="button" onClick={(e)=>this.handleSubmit()}>Submit</button>
            </div>
            )    
    }

    render=()=>{
        if(this.props.handler == "add"){
            return this.renderAdd()
        }
        else if(this.props.handler=="update" && window.location.pathname.includes("update")){
            
            return this.renderUpdate()
        }
        
    }

}