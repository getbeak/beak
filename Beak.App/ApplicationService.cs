using Prism.Events;

namespace Beak.App
{
	public sealed class ApplicationService
	{
		private ApplicationService() { }

		public static ApplicationService Instance { get; } = new ApplicationService();

		private IEventAggregator _eventAggregator;
		internal IEventAggregator EventAggregator
		{
			get
			{
				if (_eventAggregator == null)
					_eventAggregator = new EventAggregator();

				return _eventAggregator;
			}
		}
	}
}
