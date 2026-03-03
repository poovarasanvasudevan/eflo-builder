import WfNew from "../pages/WfNew.tsx";
import Flows from "../pages/Flows.tsx";
import FlowExecutions from "../pages/FlowExecutions.tsx";
import Home from "../pages/Home.tsx";
import KBMain from "../pages/KBMain.tsx";
import KBArticleView from "../pages/KBArticleView.tsx";
import KBArticleEdit from "../pages/KBArticleEdit.tsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";


export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/wf-new" element={<WfNew />} />
                <Route path="/flows" element={<Flows />} />
                <Route path="/flows/:flowId/executions" element={<FlowExecutions />} />
                <Route path="/kb" element={<KBMain />} />
                <Route path="/kb/new" element={<KBArticleEdit />} />
                <Route path="/kb/:id" element={<KBArticleView />} />
                <Route path="/kb/:id/edit" element={<KBArticleEdit />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}