import { Flex } from "@chakra-ui/react"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout")({
  component: Layout,
})

function Layout() {
  return (
    <Flex direction="column" h="100vh">
      <Outlet />
    </Flex>
  )
}

export default Layout
