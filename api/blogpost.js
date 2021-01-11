const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const multer = require('multer')
const path = require('path')
var storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, './assets/images')
    },
    filename:function(req,file,cb){
        cb(null, file.originalname.toString())
    }
})
var upload = multer({storage:storage})
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({extended:true}))
const Post = require('../models/Post')
const { validateTitle, validateDescription,  validateByline } = require('../validation')

function validatePost(post){
    let valid_title = validateTitle(post.title)
    let valid_desc = validateDescription(post.description)
    let valid_tags = ""
    let valid_byline = validateByline(post.byline)
    if(valid_title == ""
    && valid_desc == ""
    && valid_tags == ""
    && valid_byline == ""){
        return ""
    }
    else{
        return "Errors found - see below"

    }


}



/**@route - upload
 * @description - used for uploading images
 */


 /**
  * @route - posts
  * @description - to get posts
  */
router.get('/posts', (req,res)=>{
    let count = parseInt(req.query.count)
    Post.find({})
    .limit(count)
    .then((posts)=>{
        if(posts.length > 0){
            return res.json({
                posts:posts,
                message:"Posts found"
            })
        }
        else
        return res.json({
            posts:[],
            message:"No posts found"
        })
    })
    .catch((error)=>{return res.json({message:error})})
})

router.get('/posts/:id', (req,res)=>{
    let {id} = req.params
    Post.findOne({_id:id})
    .then((post)=>{
        if(post){
            return res.json({post:post, message:"Post found"})
        }
        return res.json({
            message:"Post unable to be found"
        })
    })
})

router.get('/posts/tags/:tag', (req,res)=>{
    let {tag} = req.params
    Post.find({})
    .then((posts)=>{
        let filtered_posts = posts.filter(post=>{
            for(let item in post.tags){
                if(tag == post.tags[item]){
                    return post
                }
            }
            
        })
        return res.json({
            posts:filtered_posts
        })
        
    })
})

router.post('/posts/new',(req,res)=>{
    let valid_post = validatePost(req.body)
    if(valid_post == ""){
        let new_post = new Post({
            title:req.body.title,
            date:req.body.date,
            tags:req.body.tags,
            description:req.body.description,
            byline:req.body.byline,
            private:req.body.private,
            data:req.body.data,
            user_id:req.body.user_id
        })
        
        new_post.save()
        .then((post)=>{
            if(post){
                return res.json({
                    post,
                    message:"Post created successfully"
                })
            }
            else{
                return res.json({
                    message:"Post creation unsuccessful"
                })
            }
        })
        .catch((error)=>{return res.json({message:error})})
    }
    
    else{
        return res.json({
            error:valid_post
        })
    }
})
//deletes first post
//TODO: change how it deletes post
router.post('/posts/delete',(req,res)=>{
    Post.findOneAndDelete({_id:req.body.id})
    .then((post)=>{
        if(post){
            return res.json({
                post,
                message:"Post deletion successful"
            })
        }
        else{
            return res.json({
                message:"Post deletion unsuccessful"
            })
        }
    })
    .catch((error)=>{return res.json({message:error})})
    
})
router.post('/posts/searchUser',(req,res)=>{
    Post.find({user_id:req.body.user_id})
    .limit(req.body.count)
    .then((posts)=>{
        if(posts)
        {
            return res.json({
                posts,
                message:"Personal posts found"
            })
        }
        else
        {
            return res.json({
                posts:[],
                message:"Unable to find personal posts"
            })
        }
    })
})
router.put('/posts/update',(req,res)=>{
    Post.findOneAndUpdate({_id:req.body.id}, {
        title:req.body.title,
        date:req.body.date,
        tags:req.body.tags,
        description:req.body.description,
        byline:req.body.byline,
        data:req.body.data

    })
    .then((post)=>{
        if(post){
            return res.json({
                message:"Post updated",
                post:post
            })
        }
        else{
            return res.json({
                message:"Post update unsuccessful",
                post
            })
        }
    })
    .catch(error=>console.error(error))
})

router.post('/posts/search', (req,res)=>{
    Post.find({})
    .then((posts)=>{
        if(posts.length > 0)
        {
            post_array = posts.filter((post)=>{
                let title = post.title != null ? post.title.toLowerCase() : ""
                if(title.startsWith(req.body.search.toLowerCase())){
                    return post
                }
            })
            return res.json({
                posts:post_array,
                message:"Posts found successfully"
            })
        }
        else
        {
            return res.json({
                message:"Unable to find posts",
                posts:[]
            })
        }
    })
    .catch(error=>console.error(error))
})

router.post('/posts/uploadfile', upload.single('image'), (req,res)=>{
    console.log(req.file, req.body)
        let image = req.file
        if(!image){
            console.log(image)
            return res.json({
                message:"No file found",
                success:false

            })
        }
        else{
            return res.json({
                message:"Upload completed",
                success:true
            })
        }
    })

router.get('/posts/getfile/:file', (req,res)=>{
        let {file} = req.params
        res.sendFile(path.resolve('./assets/images/' + file), (err)=>{
            if(err)
            {
                console.log(err)
                return res.json({
                    success:false,
                    file
                })
            }
        })
    
})
module.exports = router