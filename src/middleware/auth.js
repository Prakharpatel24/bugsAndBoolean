const adminAuth = (req, res, next)=> {
    const token = "qwerty";
    const isAdminAuth = token ==="ytrewq";
    if(!isAdminAuth){
        res.status(500).send("Invalid request. User not authorized");
    }
    else{
        next();
    }
};

const userAuth = (req, res, next) => {
    const token = "abcd";
    const isUserAuth = token === "dcba";
    if(!userAuth){
        res.status(500).send("Invalid request. User not authorized");
    } else{
        next();
    }
};

module.exports = {
    adminAuth,
    userAuth
}