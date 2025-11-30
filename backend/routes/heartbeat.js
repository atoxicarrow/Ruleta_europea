// Endpoint heartbeat
module.exports = function (router) {
    router.get('/heartbeat', (req, res) => {
        res.json({
            alive: true,
            timestamp: new Date(),
            mensaje: 'I am alive!',
        });
    });
};
