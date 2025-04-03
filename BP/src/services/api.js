import axios from 'axios'

const api = axios.create({
  baseURL: 'http://46.28.108.195:3000'
})

export default api
