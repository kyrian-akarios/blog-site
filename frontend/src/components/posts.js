import React from 'react'
import PostPreview from './preview-post'
import {userContext} from '../contexts/userContext'
import Axios from 'axios'
import getUser from '../contexts/auth'
import Spinner from './spinner'
import {Redirect} from 'react-router-dom'

/**@class - MainPosts
 * @description - used to show posts 
 */
export default class Posts extends React.Component
{
    constructor(props){
        super(props)
        this.state={
            posts:[],
            message:null,
            loading:false,
            redirect:null,
            count:10
        }
    }
    incrementCount(){
        Axios.get('http://localhost:8080/posts', {params:{count:this.state.count+10}})
        .then((res)=>this.setState({posts:res.data.posts, count:this.state.count+10}))
    }
    
   
    componentDidMount=()=>{
        window.addEventListener('scroll',()=>{
            const footer = document.getElementsByClassName("preview-post");
            const posts = footer[footer.length - 2]
            try{
                if(posts.getBoundingClientRect().top < 0){
                    this.incrementCount()
                }
            }
            catch{

            }
            
        })
        
    }
    componentWillMount=()=>{
        getUser()
        this.setState({loading:true})
        if(this.props.post_type == "personal"){
            if(localStorage.getItem('x-access-token')){
                Axios.post('http://localhost:8080/auth/decode',{
                    token:localStorage.getItem('x-access-token')
                })
                .then((response)=>{
                    userContext.user = response.data.user
                    return Axios.post('http://localhost:8080/posts/searchUser',{
                        user_id:userContext.user.id
                    , headers:{'x-access-token':localStorage.getItem('x-access-token')}})
    
                })
                .then((res)=>{
                    if(!res.data.auth){
                        this.setState({
                            redirect:res.data.redirect,
                            message:res.data.message
                        })
                    }
                    this.setState({posts:res.data.posts, loading:false})
                })
            }
        }
        else if(this.props.posts){
            this.setState({posts:this.props.posts, loading:false})
        }
        else if(this.props.tag){
            Axios.get('http://localhost:8080/posts/tags/' + this.props.tag, {
                headers:{'x-access-token':localStorage.getItem('x-access-token')}})
            .then((res)=>
            {
                if(!res.data.auth){
                    this.setState({
                        redirect:res.data.redirect,
                        message:res.data.message
                    })
                }
                this.setState({posts:res.data.posts, loading:false})
            }
               )
        }
        else{
            Axios.get('http://localhost:8080/posts', {params:{count:10}} )
            .then((res)=>{
                if(!res.data.auth){
                    this.setState({
                        redirect:res.data.redirect,
                        message:res.data.message
                    })
                }
                this.setState({posts:res.data.posts, loading:false})
            })
        }
        
    }

    render=()=>{
        if(this.state.loading){
            return (<Spinner/>)
        }
        if(this.state.redirect){
            return(<Redirect to="/unauth"/>)
        }
        return(
            <>
            <div id="posts-section" className="posts-section">
            {
                this.state.posts && this.state.posts.map((post)=>{
                    if(this.state.posts.length > 0){
                        if(!post.private)
                        {
                            return(
                            <userContext.Consumer>
                            {(value)=>(<PostPreview value={userContext} post={post}/>)}
                            </userContext.Consumer>
                        )

                        }
                        
                    }
                    
                })
            }
            </div>
        </>)
    }
    
}