import 'react-reflex/styles.css';

import React from 'react';
import {
	ReflexContainer,
	ReflexElement,
	ReflexSplitter,
} from 'react-reflex';

const ProjectMain: React.FunctionComponent = () => (
	<React.Fragment>
		<div style={{height: '100vh'}}>
			<ReflexContainer orientation="vertical">
				<ReflexElement className="left-pane">
					<div className="pane-content">
						{'Left Pane (resizeable)'}
					</div>
				</ReflexElement>

				<ReflexSplitter />

				<ReflexElement className="right-pane">
					<div className="pane-content">
						{'Right Pane (resizeable)'}
					</div>
				</ReflexElement>
			</ReflexContainer>
		</div>
	</React.Fragment>
);

export default ProjectMain;
