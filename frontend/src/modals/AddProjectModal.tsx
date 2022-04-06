import "./AddProjectModal.css";
import * as React from "react";
import Modal from "./Modal";
import ModalBackground from "./ModalBackground";
import LoadingScreen from "../LoadingScreen";
import { fetchBackend } from "../comm";
import { ProjectCreateVm, ProjectCreateFullResultVm, ProjectCreateResultVm } from "../models/project";

interface Props {
    hide: () => void;
    onCreated: (result: ProjectCreateFullResultVm) => void;
}

const AddProjectModal = (props: Props) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [name, setName] = React.useState("");

    const handleNameChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.currentTarget.value);
    }, []);

    const handleCreateProject = React.useCallback(() => {
        setIsLoading(true);
        const projectCreateVm: ProjectCreateVm = {name};
        fetchBackend("/api/projects", "POST", projectCreateVm)
            .then((projectCreateResult: ProjectCreateResultVm) => {
                props.onCreated({
                    createdProject: {
                        id: projectCreateResult.createdProjectId,
                        name,
                    },
                    defaultStatuses: projectCreateResult.defaultStatuses,
                });
                props.hide();
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, [name]);

    return (
        <Modal>
            <ModalBackground onClick={props.hide}>
                {isLoading && <LoadingScreen />}

                <div className="add-project-modal">
                    <div>
                        <label>Project Name</label>
                        <input value={name} onChange={handleNameChange} />
                    </div>

                    <button onClick={handleCreateProject}>Create</button>
                </div>
            </ModalBackground>
        </Modal>
    );
};

export default AddProjectModal;
