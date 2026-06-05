import type { ProjectHomeTabItem } from '@beak/common/types/beak-project';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
import { Home } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, closeTab, makeTabPermanent } from '../../store/actions';
import GenericTabContextMenuWrapper from '../atoms/GenericTabContextMenuWrapper';

interface ProjectHomeTabProps {
	tab: ProjectHomeTabItem;
}

const ProjectHomeTab: React.FC<ProjectHomeTabProps> = ({ tab }) => {
	const dispatch = useDispatch();
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const projectName = useAppSelector(s => s.global.project.name) ?? 'Project';
	const [target, setTarget] = useState<HTMLElement>();

	return (
		<GenericTabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === tab.payload}
				variant='card'
				preview={tab.temporary}
				leading={
					<Box
						as='span'
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						w='18px'
						h='18px'
						borderRadius='sm'
						borderWidth='1px'
						borderStyle='solid'
						color='accent.teal'
						bg='color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-teal) 26%, transparent)'
						boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
					>
						<Home size={11} strokeWidth={2.2} />
					</Box>
				}
				key={tab.payload}
				lazyForwardedRef={i => setTarget(i!)}
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary) return;
					dispatch(makeTabPermanent(tab.payload));
				}}
				onClose={() => dispatch(closeTab(tab.payload))}
			>
				{projectName}
			</TabItem>
		</GenericTabContextMenuWrapper>
	);
};

export default ProjectHomeTab;
