addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  var url_list = await getVariantURLs();
  let response = await getCorrectResponse(request, url_list);
  return REWRITER.transform(response);
}

/** 
 * Return array of two urls fetched from the const url json
 */
async function getVariantURLs() {
  const url = "https://cfw-takehome.developers.workers.dev/api/variants";
  let response = await fetch(url);
  let json = await response.json();
  var sites = json["variants"];
  return sites;
}

/**
   * Return appropriate response from sites based on the cookie value of request
   * @param {Request} request, {Array} sites
   */
async function getCorrectResponse(request, sites) {
  const NAME = 'A/B';
  const TEST = 'A';
  const CONTROL ='B';
  const cookie = request.headers.get('cookie');
  const TEST_RESPONSE = await fetch(sites[0]);
  const CONTROL_RESPONSE = await fetch(sites[1]);

  let response = null;
  if (cookie && cookie.includes(`${NAME}=${TEST}`)) {
    response = CONTROL_RESPONSE;
  } else if (cookie && cookie.includes(`${NAME}=${CONTROL}`)) {
    response = TEST_RESPONSE;
  } else {
    let group = Math.random() < 0.5 ? TEST : CONTROL;
    response = group === 'control' ? CONTROL_RESPONSE : TEST_RESPONSE;
    response = new Response(response.body, response);
    response.headers.append('Set-Cookie', `${NAME}=${group}`);
  }
  return response;
}

const REWRITER = new HTMLRewriter()
  .on('title', { element: e => e.setInnerContent("This is the title <3")})
  .on('h1#title', {element: e => e.before("THE NEWEST AND BEST")})
  .on('p#description', { element: e => e.setInnerContent("Hello cloudflare people! Thank you " + 
    "for this challenge I actually had a lot of fun doing it! And also a big thank you" + 
    " for striving to help others in times like these <3")})
  .on('a#url', { element: e => e.setInnerContent("Click me for money!")})
  .on('a', { element: e => e.setAttribute("href", "https://www.youtube.com/watch?v=dQw4w9WgXcQ")});

