const title = ' 物联中台'

export default function getPageTitle (pageTitle) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return title
}
