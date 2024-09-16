import mongoose from 'mongoose';

// creating the userSchema
const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    friendList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    friendRequestsSent: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    friendRequestsReceived: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    interests: {
        type: [String],
        lowercase: true,
        default: []
    },
    
}, { timestamps: true });


userSchema.virtual('mutualFriends').get(function (otherUser) {
    const mutualFriends = this.friendList.filter(friend =>
        otherUser.friendList.includes(friend.toString())
    );
    return mutualFriends.length;
});

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10)
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);

}

userSchema.methods.generateAccessToken = async function(){
    return await jsonwebtoken.sign(
        {
            _id:this._id,
            email:this.email,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:ACCESS_TOKEN_EXPIRY
        }
    )
} 



const User = mongoose.model('User', userSchema);
export { User };
