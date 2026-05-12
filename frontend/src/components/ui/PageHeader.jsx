import Button from './Button'

function PageHeader({ title, description, breadcrumb = [], primaryActionLabel, onPrimaryAction }) {
  return (
    <div className="page-header">
      <div>
        <div className="page-breadcrumb">
          {breadcrumb.map((item, index) => (
            <span key={`${item}-${index}`}>
              {index > 0 ? ' / ' : ''}
              {item}
            </span>
          ))}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {primaryActionLabel ? <Button onClick={onPrimaryAction}>{primaryActionLabel}</Button> : null}
    </div>
  )
}

export default PageHeader
