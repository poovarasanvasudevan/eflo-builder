import WfNew from "../pages/WfNew.tsx";
import Flows from "../pages/Flows.tsx";
import FlowExecutions from "../pages/FlowExecutions.tsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";


export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/wf-new" element={<WfNew />} />
                <Route path="/flows" element={<Flows />} />
                <Route path="/flows/:flowId/executions" element={<FlowExecutions />} />
                <Route path="*" element={<Navigate to="/wf-new" replace />} />
            </Routes>
        </BrowserRouter>
    )
}