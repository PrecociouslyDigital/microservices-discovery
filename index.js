const app = require("express")();

const storage = require('node-persist');
storage.init( /* options ... */ );
const lookup = require('util').promisify(require("dns").lookupService);

const helpers = {
    IP_ADDR: (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    HOSTNAME: async (req) => (await lookup(helpers.IP_ADDR(req), 22)).hostname
}
app.use(require("raw-body"));


const regex = /{.+}/g;

/*
* POST a service with a body to name it.
* GET to get the config back
* No actual restrictions on format, but ideally should be valid json that you can
* straight up spread into a constructor
* Specify a secret in header to lock it down
*/
app.route(/:serviceName(.+)/)
    .get(async (req, res, next) => res.send(
        (await storage.getItem(req.params.serviceName)).config
    ))
    .post(async (req, res, next) => {
        const service = await storage.getItem(req.params.serviceName);
        if(service.secret == null || req.headers.secret !== service.secret){
            res.status(401).send("Need a secret!");
        }else{
            const encoded = req.rawBody.replace(regex, (match)=>helpers[match](req));
            await storage.putItem(req.params.serviceName, {
                config: encoded,
                secret: service.secret,
            });
            res.send(encoded);
        }
        await storage.setItem(res)
    });

app.listen(8181,
    () => console.log(`Microservices app listening on port 8181!`))
