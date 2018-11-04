const app = require("express")();

const storage = require('node-persist');
storage.init( /* options ... */ );
const lookup = require('util').promisify(require("dns").lookupService);
const getRawBody = require("raw-body");
const contentType = require('content-type');
const stringReplaceAsync = require('string-replace-async');


const helpers = {
    IP_ADDR: (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    HOSTNAME: async (req) => (await lookup(helpers.IP_ADDR(req), 22)).hostname,
    default: (req, match)=>`{${match}}`,
}
app.use(function (req, res, next) {
  getRawBody(req, {
    length: req.headers['content-length'],
    limit: '1mb',
    encoding: true
  }, function (err, string) {
    if (err) return next(err)
    req.text = string
    next()
  })
});
const regex = /{.+}/g;

/*
* POST a service with a body to name it.
* GET to get the config back
* No actual restrictions on format, but ideally should be valid json that you can
* straight up spread into a constructor
* Specify a secret in header to lock it down
*/
app.route("/:serviceName+")
    .get(async (req, res, next) => res.send(
        await storage.getItem(req.params.serviceName).then((service) =>
            service != null ? res.send(service.config) : res.status(404).json(null)
        ).catch(()=>res.status(500).JSON({
            error: "Server Error"
        }))
    ))
    .post(async (req, res, next) => {
        const service = await storage.getItem(req.params.serviceName);
        if(service != null){
            if(service.secret != null && req.headers.secret !== service.secret){
                res.status(401).send("Need a secret!");
                return;
            }
        }
        console.log("Hey");
        console.log(req.text);
        const replacesPromises = req.text.match(regex).map((match)=>{
            const matchText = match.slice(1,-1);
            const helper = helpers[matchText]||helpers["default"];
            const result =  helper(req,matchText);
            console.log("helper run");
            console.log(result);
            return result;
        });
        const replaces = [];
        for(let thing of replacesPromises)
            replaces.push(await thing);
        const encoded = req.text.replace(regex, ()=>replaces.shift()); 
        console.log(encoded);
        await storage.setItem(req.params.serviceName, {
            config: encoded,
            ...(req.headers.secret != null ? {secret: req.headers.secret} : {}),
        });
        res.send(encoded);
        return;
    });

app.listen(8181,
    () => console.log(`Microservices app listening on port 8181!`))
