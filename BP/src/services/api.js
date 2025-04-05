import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.stavebninylysa.cz'
})

export default api
