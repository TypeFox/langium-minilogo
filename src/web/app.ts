/**
 * Simple app for serving generated examples
 */

import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, resp) => {
    // return some link to the two examples for now...
    resp.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
    body, html {
        background: #333;
        color: #fff;
        font-family: "Codicon", Arial;
    }
    a {
        color: #fff;
        transition: 0.3s;
        font-size: 20px;
    }
    a:hover {
        color: #6cf;
    }
    </style>
</head>
<body>
<ul>
    <h1>MiniLogo Examples</h1>
    <li><a href='/test/'>Test Example</a></li>
    <li><a href='/langium/'>Langium Logo Example</a></li>
</ul>
</body>
</html>
    `);
});

app.use(express.static('./examples/generated'));

app.listen(port, () => {
  console.log(`Server for MiniLogo assets listening on http://localhost:${port}`);
});