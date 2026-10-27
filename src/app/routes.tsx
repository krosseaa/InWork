import { createBrowserRouter } from 'react-router'
import { InWorkApp } from './InWorkApp'

export const router = createBrowserRouter([{ path: '*', Component: InWorkApp }])
