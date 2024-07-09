const  mongoose = require("mongoose")
const redis = require("redis");
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl)
const util = require("util")
client.hget = util.promisify(client.hget)
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {key: 'default'}) {
    this.useCache = true
    this.hashKey = JSON.stringify(options.key)
    return this; // to make function chainable
}

mongoose.Query.prototype.exec = async function () {
    if(!this.useCache) {
        return await exec.apply(this, arguments)
    }
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {collection: this.mongooseCollection.name}))
    const cachedValue = await client.hget(this.hashKey, key)
    if(cachedValue) {
        console.log("FROM CACHE")
        const doc = JSON.parse(cachedValue)
        return Array.isArray(doc) ? doc.map(d=> new this.model(d)) : new this.model(doc)
    }
    console.log("FROM MONGO")
    const result = await exec.apply(this, arguments)
    client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 300)
    return result;
}

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey))
    }
}