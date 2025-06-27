export function cn(...c){
    return c.filter(i => typeof i != 'undefined' && i != '').join(' ')
}