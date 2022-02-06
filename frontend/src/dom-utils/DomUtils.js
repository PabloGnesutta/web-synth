function $(selector) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 1) return elements[0];
  else return  elements;
}

export {
  $
};