const mongoose=require("mongoose")
const validator=require("validator")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const sharp=require('sharp')

const Task=require("./task")
const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
        unique:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Email is not correct")
            }
        }
    },
    password:{
        type:String,
        required:true,
        minLength:5,
        validate(value){
            if(value.includes("password")){
                throw new Error("password is weak")
            }
        }
    },
    avatar:{
     type:Buffer
    },
    tokens:[{
      token:{
        type:String,
        required:true
      }
    }]
},
{
    timestamps:true
})

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})


userSchema.methods.toJSON=function(){
    const user=this
    const userObject=user.toObject()
    delete userObject.password
    delete userObject.tokens 
    delete userObject.avatar
    return userObject
}

userSchema.methods.generateAuthToken= async function(){
 const user=this
 console.log(user)
 const token= jwt.sign({_id:user._id.toString()},process.env.JWT_SK)
 user.tokens=user.tokens.concat({token:token})
 await user.save()


  return token
}

userSchema.statics.findTheCredential=async(email,password)=>{
    const user=await User.findOne({email:email})
    if(!user){
                throw new Error("unable to login")
    }

    const isValid=await bcrypt.compare(password,user.password)
    if(!isValid){
        throw new Error("unable to login")
    }
    return user
}

userSchema.pre('save',async function (next){
   const user=this

  if(user.isModified("password")){
    user.password= await bcrypt.hash(user.password,8)
  }

   next()
})
//delete user tasks when user is remove
userSchema.pre('remove',async function(next){
    const user =this

   await Task.deleteMany({owner:user._id})
    
    next()
})

const User=mongoose.model("User",userSchema)



module.exports=User